import { Logger, NetworkManager, TxWriter, ViemClientManager } from "@concero/operator-utils";
import { Hash, isHex, Log, PublicClient, type Address } from "viem";
import { MessagingDeploymentManager } from "../../common/managers";

import { getAbiItem } from "viem";
import { eventEmitter, globalConfig } from "../../constants";
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
    deploymentManager: MessagingDeploymentManager,
): Promise<boolean> {
    const conceroVerifierNetwork = networkManager.getVerifierNetwork();

    const isRegistered = (await publicClient.readContract({
        address: await deploymentManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "isOperatorRegistered",
        args: [globalConfig.OPERATOR_ADDRESS],
    })) as boolean;

    return isRegistered;
}

/**
 * Requests the registration of an operator.
 *
 * @param networkManager - The network manager instance.
 * @param deploymentManager - The deployment manager instance.
 * @returns {Promise<`0x${string}`>} The transaction hash of the registration request.
 */
async function requestOperatorRegistration(
    networkManager: NetworkManager,
    deploymentManager: MessagingDeploymentManager,
): Promise<`0x${string}`> {
    const conceroVerifierNetwork = networkManager.getVerifierNetwork();
    const chainTypes = [BigInt(ChainType.EVM)];
    const operatorActions = [BigInt(OperatorRegistrationAction.Register)];
    const operatorAddresses = [globalConfig.OPERATOR_ADDRESS];

    const transactionHash = await TxWriter.getInstance().callContract(conceroVerifierNetwork, {
        address: await deploymentManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "requestOperatorRegistration",
        args: [chainTypes, operatorActions, operatorAddresses],
    });

    eventEmitter.emit("requestOperatorRegistration", { txHash: transactionHash });

    return transactionHash;
}

/**
 * Waits for the operator registration event on the ConceroVerifier contract by polling blocks.
 * This function continuously polls for new blocks and checks for OperatorRegistered events
 * that match the specified operator address.
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
    const logger = Logger.getInstance().getLogger("waitForOperatorRegistration");
    const viemClientManager = ViemClientManager.getInstance();
    const { publicClient } = viemClientManager.getClients(network);

    const POLL_INTERVAL_MS = 3 * 1000;
    const MAX_RETRIES = 100;
    const EVENT_NAME = "OperatorRegistered";
    let retries = 0;

    logger.info(
        `Waiting for operator registration event for ${operatorAddress} from block ${fromBlockNumber}`,
    );

    return new Promise((resolve, reject) => {
        const checkForRegistrationEvent = async () => {
            if (retries >= MAX_RETRIES) {
                reject(new Error("Max retries reached while waiting for operator registration"));
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
                        name: "OperatorRegistered",
                    }),
                });

                const matchingLog = findOperatorRegistrationLog(logs, operatorAddress);
                if (matchingLog && matchingLog.transactionHash) {
                    resolve(matchingLog.transactionHash);
                    return;
                }

                setTimeout(checkForRegistrationEvent, POLL_INTERVAL_MS);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`Error while polling for operator registration: ${errorMessage}`);

                setTimeout(checkForRegistrationEvent, POLL_INTERVAL_MS);
            }
        };

        checkForRegistrationEvent();
    });
}

/**
 * Helper function to find the operator registration log for a specific operator address
 * within a collection of logs. It decodes each log and checks if it matches our operator.
 *
 * @param logs - Array of logs to search through
 * @param operatorAddress - Address of the operator to find
 * @returns The matching log or undefined if not found
 */
function findOperatorRegistrationLog(logs: Log[], operatorAddress: string): Log | undefined {
    const EVENT_NAME = "OperatorRegistered";
    const logger = Logger.getInstance().getLogger("findOperatorRegistrationLog");

    for (const log of logs) {
        try {
            if (
                log?.args?.operator.toLowerCase() === operatorAddress.toLowerCase() &&
                isHex(log.transactionHash)
            ) {
                return log;
            }
        } catch (error) {
            logger.debug(
                `Error decoding log: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    return undefined;
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
    const deploymentManager = MessagingDeploymentManager.getInstance();

    const verifierNetwork = networkManager.getVerifierNetwork();
    const { publicClient } = viemClientManager.getClients(verifierNetwork);

    const registered = await isOperatorRegistered(publicClient, networkManager, deploymentManager);

    if (registered) {
        logger.info("Operator already registered");
        eventEmitter.emit("operatorRegistered", {});
        return;
    }

    const txHash = await requestOperatorRegistration(networkManager, deploymentManager);

    logger.info(`Requested operator registration with txHash ${txHash}`);

    const transaction = await publicClient.getTransaction({ hash: txHash });

    const confirmedTxHash = await waitForOperatorRegistration(
        verifierNetwork,
        await deploymentManager.getConceroVerifier(),
        transaction.blockNumber,
        globalConfig.OPERATOR_ADDRESS,
    );

    logger.info(`Operator registration confirmed with txHash ${confirmedTxHash}`);
    eventEmitter.emit("operatorRegistered", {});
}
