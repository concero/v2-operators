import { Address, formatUnits, getAbiItem, Hash } from 'viem';
import type {
    ConceroNetwork,
    ITxWriter,
    IViemClientManager,
    LoggerInterface,
    NetworkManager,
} from '@concero/operator-utils';
import { MessagingDeploymentManager } from './MessagingDeploymentManager';

import { RelayerSetupConfig } from '../types/ManagerConfigs';

export class RelayerSetup {
    private readonly logger: LoggerInterface;
    private readonly networkManager: NetworkManager;
    private readonly viemClientManager: IViemClientManager;
    private readonly deploymentManager: MessagingDeploymentManager;
    private readonly txWriter: ITxWriter;
    private readonly config: RelayerSetupConfig;

    constructor(
        logger: LoggerInterface,
        networkManager: NetworkManager,
        viemClientManager: IViemClientManager,
        deploymentManager: MessagingDeploymentManager,
        txWriter: ITxWriter,
        config: RelayerSetupConfig,
    ) {
        this.logger = logger;
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.deploymentManager = deploymentManager;
        this.txWriter = txWriter;
        this.config = config;
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: NetworkManager,
        viemClientManager: IViemClientManager,
        deploymentManager: MessagingDeploymentManager,
        txWriter: ITxWriter,
        config: RelayerSetupConfig,
    ): RelayerSetup {
        return new RelayerSetup(
            logger,
            networkManager,
            viemClientManager,
            deploymentManager,
            txWriter,
            config,
        );
    }

    public async executeSetup(): Promise<void> {
        try {
            await this.ensureOperatorIsRegistered();
            await this.ensureOperatorDeposit();

            this.logger.info('Relayer setup successful');
        } catch (error) {
            this.logger.error('Relayer setup failed:', error);
            throw error;
        }
    }

    private async ensureOperatorIsRegistered(): Promise<void> {
        const verifierNetwork = this.networkManager.getVerifierNetwork();
        const { publicClient } = this.viemClientManager.getClients(verifierNetwork.name);
        const verifierAddress = await this.deploymentManager.getConceroVerifier();

        const isRegistered = await publicClient.readContract({
            address: verifierAddress,
            abi: this.config.abi.CONCERO_VERIFIER,
            functionName: 'isOperatorRegistered',
            args: [this.config.operatorAddress],
        });

        if (isRegistered) {
            this.logger.info('Operator is registered');
            return;
        }

        const chainTypes = [BigInt(0)]; // EVM = 0
        const operatorActions = [BigInt(1)]; // Register = 1
        const operatorAddresses = [this.config.operatorAddress];

        const txHash = await this.txWriter.callContract(verifierNetwork, {
            address: verifierAddress,
            abi: this.config.abi.CONCERO_VERIFIER,
            functionName: 'requestOperatorRegistration',
            args: [chainTypes, operatorActions, operatorAddresses],
        });

        this.logger.info(`Requested operator registration with txHash ${txHash}`);

        const transaction = await publicClient.getTransaction({ hash: txHash });

        const confirmedTxHash = await this.waitForOperatorRegistration(
            verifierNetwork,
            verifierAddress,
            transaction.blockNumber!,
            this.config.operatorAddress,
        );

        this.logger.info(`Operator registration confirmed with txHash ${confirmedTxHash}`);
    }

    private async ensureOperatorDeposit(): Promise<void> {
        const verifierNetwork = this.networkManager.getVerifierNetwork();
        const verifierAddress = await this.deploymentManager.getConceroVerifier();
        const { publicClient } = this.viemClientManager.getClients(verifierNetwork.name);

        const requiredDeposit =
            (await publicClient.readContract({
                address: verifierAddress,
                abi: this.config.abi.CONCERO_VERIFIER,
                functionName: 'getMinimumOperatorDeposit',
                args: [],
            })) * 200n;

        const currentDeposit = await publicClient.readContract({
            address: verifierAddress,
            abi: this.config.abi.CONCERO_VERIFIER,
            functionName: 'getOperatorDeposit',
            args: [this.config.operatorAddress],
        });

        if (currentDeposit >= requiredDeposit) {
            this.logger.info(`Deposit of ${formatUnits(currentDeposit, 18)} is sufficient`);
            return;
        }

        const txHash = await this.txWriter.callContract(verifierNetwork, {
            address: verifierAddress,
            abi: this.config.abi.CONCERO_VERIFIER,
            functionName: 'operatorDeposit',
            args: [this.config.operatorAddress],
            value: requiredDeposit,
        });

        this.logger.info(`Deposited ${requiredDeposit} to ConceroVerifier with hash ${txHash}`);
    }

    private async waitForOperatorRegistration(
        network: ConceroNetwork,
        contractAddress: Address,
        fromBlockNumber: bigint,
        operatorAddress: string,
    ): Promise<Hash> {
        const { publicClient } = this.viemClientManager.getClients(network.name);

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
                            abi: this.config.abi.CONCERO_VERIFIER,
                            name: 'OperatorRegistered',
                        }),
                    });

                    const matchingLog = logs.find(
                        log =>
                            log.args?.operator?.toLowerCase() === operatorAddress.toLowerCase() &&
                            log.transactionHash,
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
