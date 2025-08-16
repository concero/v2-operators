import type {
    ConceroNetwork,
    ITxWriter,
    IViemClientManager,
    LoggerInterface,
    NetworkManager,
} from '@concero/operator-utils';
import { Address, Hash, getAbiItem } from 'viem';

import { globalConfig } from '../../constants';
import { MessagingDeploymentManager } from '../MessagingDeploymentManager';

export class RelayerSetup {
    private readonly logger: LoggerInterface;
    private readonly networkManager: NetworkManager;
    private readonly viemClientManager: IViemClientManager;
    private readonly deploymentManager: MessagingDeploymentManager;
    private readonly txWriter: ITxWriter;

    constructor(
        logger: LoggerInterface,
        networkManager: NetworkManager,
        viemClientManager: IViemClientManager,
        deploymentManager: MessagingDeploymentManager,
        txWriter: ITxWriter,
    ) {
        this.logger = logger;
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.deploymentManager = deploymentManager;
        this.txWriter = txWriter;
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: NetworkManager,
        viemClientManager: IViemClientManager,
        deploymentManager: MessagingDeploymentManager,
        txWriter: ITxWriter,
    ): RelayerSetup {
        return new RelayerSetup(
            logger,
            networkManager,
            viemClientManager,
            deploymentManager,
            txWriter,
        );
    }

    public async executeSetup(): Promise<void> {
        this.logger.info('Starting relayer setup...');

        try {
            await this.ensureOperatorIsRegistered();
            await this.ensureOperatorDeposit();

            this.logger.info('Relayer setup completed successfully');
        } catch (error) {
            this.logger.error('Relayer setup failed:', error);
            throw error;
        }
    }

    private async ensureOperatorIsRegistered(): Promise<void> {
        this.logger.info('Ensuring operator is registered...');

        const verifierNetwork = this.networkManager.getVerifierNetwork();
        const { publicClient } = this.viemClientManager.getClients(verifierNetwork);
        const verifierAddress = (await this.deploymentManager.getConceroVerifier()) as Address;

        const isRegistered = (await publicClient.readContract({
            address: verifierAddress,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: 'isOperatorRegistered',
            args: [globalConfig.OPERATOR_ADDRESS],
        })) as boolean;

        if (isRegistered) {
            this.logger.info('Operator already registered');
            return;
        }

        const chainTypes = [BigInt(0)]; // EVM = 0
        const operatorActions = [BigInt(1)]; // Register = 1
        const operatorAddresses = [globalConfig.OPERATOR_ADDRESS];

        const txHash = await this.txWriter.callContract(verifierNetwork, {
            address: verifierAddress,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: 'requestOperatorRegistration',
            args: [chainTypes, operatorActions, operatorAddresses],
        });

        this.logger.info(`Requested operator registration with txHash ${txHash}`);

        const transaction = await publicClient.getTransaction({ hash: txHash as `0x${string}` });

        const confirmedTxHash = await this.waitForOperatorRegistration(
            verifierNetwork,
            verifierAddress,
            transaction.blockNumber!,
            globalConfig.OPERATOR_ADDRESS,
        );

        this.logger.info(`Operator registration confirmed with txHash ${confirmedTxHash}`);
    }

    private async ensureOperatorDeposit(): Promise<void> {
        this.logger.info('Ensuring operator deposit is sufficient...');

        const verifierNetwork = this.networkManager.getVerifierNetwork();
        const verifierAddress = (await this.deploymentManager.getConceroVerifier()) as Address;
        const { publicClient } = this.viemClientManager.getClients(verifierNetwork);

        const requiredDeposit =
            ((await publicClient.readContract({
                address: verifierAddress,
                abi: globalConfig.ABI.CONCERO_VERIFIER,
                functionName: 'getMinimumOperatorDeposit',
                args: [],
            })) as bigint) * 200n;

        const currentDeposit = (await publicClient.readContract({
            address: verifierAddress,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: 'getOperatorDeposit',
            args: [globalConfig.OPERATOR_ADDRESS],
        })) as bigint;

        if (currentDeposit >= requiredDeposit) {
            this.logger.info(`Sufficient deposit of ${currentDeposit} already exists`);
            return;
        }

        const txHash = await this.txWriter.callContract(verifierNetwork, {
            address: verifierAddress,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: 'operatorDeposit',
            args: [globalConfig.OPERATOR_ADDRESS],
            value: requiredDeposit,
        });

        this.logger.info(`Deposited ${requiredDeposit} to ConceroVerifier with hash ${txHash}`);
    }

    public async validateSetup(): Promise<boolean> {
        try {
            this.logger.info('Validating relayer setup...');

            // Add validation logic here if needed
            // For example, check if operator is still registered, deposit is still sufficient, etc.

            this.logger.info('Relayer setup validation completed');
            return true;
        } catch (error) {
            this.logger.error('Setup validation failed:', error);
            return false;
        }
    }

    private async waitForOperatorRegistration(
        network: ConceroNetwork,
        contractAddress: Address,
        fromBlockNumber: bigint,
        operatorAddress: string,
    ): Promise<Hash> {
        const { publicClient } = this.viemClientManager.getClients(network);

        const POLL_INTERVAL_MS = 3 * 1000;
        const MAX_RETRIES = 100;
        let retries = 0;

        this.logger.info(
            `Waiting for operator registration event for ${operatorAddress} from block ${fromBlockNumber}`,
        );

        return new Promise((resolve, reject) => {
            const checkForRegistrationEvent = async () => {
                if (retries >= MAX_RETRIES) {
                    reject(
                        new Error('Max retries reached while waiting for operator registration'),
                    );
                    return;
                }

                retries++;

                try {
                    const latestBlockNumber = await publicClient.getBlockNumber();

                    if (latestBlockNumber <= fromBlockNumber && retries > 1) {
                        setTimeout(checkForRegistrationEvent, POLL_INTERVAL_MS);
                        return;
                    }

                    const logs = await publicClient.getLogs({
                        address: contractAddress,
                        fromBlock: fromBlockNumber,
                        toBlock: latestBlockNumber,
                        event: getAbiItem({
                            abi: globalConfig.ABI.CONCERO_VERIFIER,
                            name: 'OperatorRegistered',
                        }) as any,
                    });

                    const matchingLog = logs.find(
                        log =>
                            (log as any).args?.operator?.toLowerCase() ===
                                operatorAddress.toLowerCase() && log.transactionHash,
                    );

                    if (matchingLog && matchingLog.transactionHash) {
                        resolve(matchingLog.transactionHash);
                        return;
                    }

                    setTimeout(checkForRegistrationEvent, POLL_INTERVAL_MS);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(
                        `Error while polling for operator registration: ${errorMessage}`,
                    );

                    setTimeout(checkForRegistrationEvent, POLL_INTERVAL_MS);
                }
            };

            checkForRegistrationEvent();
        });
    }
}
