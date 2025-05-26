import { type Address, Hash, PublicClient, WalletClient, decodeEventLog } from "viem";

import {
    EventListenerHandle,
    setupEventListener,
} from "../../common/eventListener/setupEventListener";
import { DeploymentManager, NetworkManager, ViemClientManager } from "../../common/managers";
import { callContract } from "../../common/utils";
import { Logger, LoggerInterface } from "../../common/utils/logger";

import { globalConfig } from "../../constants";
import { eventEmitter } from "../../constants/eventEmitter";
import { ConceroNetwork } from "../../types/ConceroNetwork";

const ChainType = {
    EVM: 0,
    NON_EVM: 1,
};

const OperatorRegistrationAction = {
    Deregister: 0,
    Register: 1,
};

/**
 * Checks if the operator is registered in the ConceroVerifier contract.
 *
 * @param publicClient - The public client to use for reading the contract.
 * @param networkManager - The network manager instance.
 * @param deploymentManager - The deployment manager instance.
 * @returns {Promise<boolean>} Whether the operator is registered.
 * @notice Checks if the operator is registered in the ConceroVerifier contract.
 */
async function isOperatorRegistered(
    publicClient: PublicClient,
    networkManager: NetworkManager,
    deploymentManager: DeploymentManager,
): Promise<boolean> {
    const conceroVerifierNetwork = networkManager.getVerifierNetwork();

    const isRegistered = await publicClient.readContract({
        chain: conceroVerifierNetwork.viemChain,
        address: await deploymentManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "isOperatorRegistered",
        args: [globalConfig.OPERATOR_ADDRESS],
    });

    return isRegistered;
}

/**
 * Requests operator registration from the ConceroVerifier contract.
 *
 * @param publicClient - The public client to use for reading the contract.
 * @param walletClient - The wallet client to use for writing to the contract.
 * @param account - The account to use for the transaction.
 * @param networkManager - The network manager instance.
 * @param deploymentManager - The deployment manager instance.
 * @returns {Promise<`0x${string}`>} The transaction hash of the registration request.
 */
async function requestOperatorRegistration(
    publicClient: PublicClient,
    walletClient: WalletClient,
    account: any,
    networkManager: NetworkManager,
    deploymentManager: DeploymentManager,
): Promise<`0x${string}`> {
    const conceroVerifierNetwork = networkManager.getVerifierNetwork();
    const chainTypes = [BigInt(ChainType.EVM)];
    const operatorActions = [BigInt(OperatorRegistrationAction.Register)];
    const operatorAddresses = [globalConfig.OPERATOR_ADDRESS];

    const { transactionHash } = await callContract(publicClient, walletClient, {
        chain: conceroVerifierNetwork.viemChain,
        address: await deploymentManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "requestOperatorRegistration",
        args: [chainTypes, operatorActions, operatorAddresses],
        account,
    });

    eventEmitter.emit("requestOperatorRegistration", { txHash: transactionHash });

    return transactionHash;
}

/**
 * Waits for the operator registration event on the ConceroVerifier contract.
 *
 * @param network - The network instance to monitor.
 * @param contractAddress - The address of the ConceroVerifier contract.
 * @param fromBlockNumber - The block number from which to start polling.
 * @param operatorAddress - The operator address to wait for registration.
 * @returns {Promise<Hash>} The transaction hash of the operator registration.
 */
export async function waitForOperatorRegistration(
    network: ConceroNetwork,
    contractAddress: Address,
    fromBlockNumber: bigint,
    operatorAddress: string,
): Promise<Hash> {
    return new Promise((resolve, reject) => {
        let listenerHandle: EventListenerHandle;

        const onLogs = (logs: any[]) => {
            for (const log of logs) {
                try {
                    const decoded = decodeEventLog({
                        abi: globalConfig.ABI.CONCERO_VERIFIER,
                        eventName: "OperatorRegistered",
                        data: log.data,
                        topics: log.topics,
                        strict: true,
                    });
                    if (
                        decoded &&
                        decoded.args &&
                        decoded.args.operator &&
                        decoded.args.operator.toLowerCase() === operatorAddress.toLowerCase() &&
                        BigInt(log.blockNumber) >= fromBlockNumber
                    ) {
                        listenerHandle.stop();
                        resolve(log.transactionHash);
                        break;
                    }
                } catch (error) {}
            }
        };

        setupEventListener(
            network,
            contractAddress,
            onLogs,
            globalConfig.BLOCK_MANAGER.POLLING_INTERVAL_MS,
        ).then(handle => {
            listenerHandle = handle;
        });
    });
}

/**
 * Ensures that the operator is registered in the ConceroVerifier contract. If the operator is not
 * registered, it will request registration and wait for the registration to be confirmed.
 *
 * @returns {Promise<void>}
 */
export async function ensureOperatorIsRegistered(): Promise<void> {
    const logger = Logger.getInstance().getLogger("ensureOperatorIsRegistered");
    const viemClientManager = ViemClientManager.getInstance();
    const networkManager = NetworkManager.getInstance();
    const deploymentManager = DeploymentManager.getInstance();

    const verifierNetwork = networkManager.getVerifierNetwork();
    const { publicClient, walletClient, account } = viemClientManager.getClients(verifierNetwork);

    const registered = await isOperatorRegistered(publicClient, networkManager, deploymentManager);

    if (registered) {
        logger.info("Operator already registered");
        return;
    }

    const txHash = await requestOperatorRegistration(
        publicClient,
        walletClient,
        account,
        networkManager,
        deploymentManager,
    );

    logger.info(`Requested operator registration with txHash ${txHash}`);

    const transaction = await publicClient.getTransaction({ hash: txHash });

    const confirmedTxHash = await waitForOperatorRegistration(
        verifierNetwork,
        await deploymentManager.getConceroVerifier(),
        transaction.blockNumber,
        globalConfig.OPERATOR_ADDRESS,
    );

    logger.info(`Operator registration confirmed with txHash ${confirmedTxHash}`);
    eventEmitter.emit("operatorRegistered", { txHash: confirmedTxHash });
}
