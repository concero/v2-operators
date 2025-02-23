import { type Address, decodeEventLog, PublicClient, WalletClient } from "viem";
import { conceroNetworks, globalConfig } from "../../../constants";
import { ConceroNetwork, type ConceroNetworkNames } from "../../../types/ConceroNetwork";
import {
    EventListenerHandle,
    setupEventListener,
} from "../../common/eventListener/setupEventListener";
import { callContract, getFallbackClients, logger } from "../../common/utils";
import { config } from "../constants";

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
 * @returns {Promise<boolean>} Whether the operator is registered.
 * @notice Checks if the operator is registered in the ConceroVerifier contract.
 */

async function isOperatorRegistered(publicClient: any): Promise<boolean> {
    const conceroVerifierNetwork = config.networks.conceroVerifier;

    const isRegistered = await publicClient.readContract({
        chain: conceroVerifierNetwork.viemChain,
        address: conceroNetworks[conceroVerifierNetwork.name].addresses.conceroVerifier,
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "isOperatorRegistered",
        args: [globalConfig.OPERATOR_ADDRESS],
    });

    return isRegistered;
}

async function requestOperatorRegistration(
    publicClient: PublicClient,
    walletClient: WalletClient,
    account: any,
): Promise<`0x${string}`> {
    const conceroVerifierNetwork = config.networks.conceroVerifier;
    const chainTypes = [BigInt(ChainType.EVM)];
    const operatorActions = [BigInt(OperatorRegistrationAction.Register)];
    const operatorAddresses = [globalConfig.OPERATOR_ADDRESS];

    const txHash = await callContract(publicClient, walletClient, {
        chain: conceroVerifierNetwork.viemChain,
        address: conceroNetworks[conceroVerifierNetwork.name].addresses.conceroVerifier,
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "requestOperatorRegistration",
        args: [chainTypes, operatorActions, operatorAddresses],
        account,
    });

    config.eventEmitter.emit("requestOperatorRegistration", { txHash });

    return txHash;
}

/**
 * Waits for the operator registration event on the ConceroVerifier contract.
 *
 * @param conceroVerifierNetwork - The network instance to monitor.
 * @param fromBlockNumber - The block number from which to start polling.
 * @param operatorAddress - The operator address to wait for registration.
 */
export async function waitForOperatorRegistration(
    network: ConceroNetwork,
    contractAddress: Address,
    fromBlockNumber: bigint,
    operatorAddress: string,
): Promise<void> {
    const conceroVerifierAbi = await import("../../../abi/ConceroVerifier.json");

    return new Promise((resolve, reject) => {
        let listenerHandle: EventListenerHandle;

        const onLogs = (_chain: ConceroNetworkNames, _address: Address, logs: any[]) => {
            for (const log of logs) {
                try {
                    const decoded = decodeEventLog({
                        abi: conceroVerifierAbi,
                        eventName: "operatorRegistered",
                        data: log.data,
                        topics: log.topics,
                    });
                    if (
                        decoded &&
                        decoded.operatorAddress &&
                        decoded.operatorAddress.toLowerCase() === operatorAddress.toLowerCase() &&
                        BigInt(log.blockNumber) >= fromBlockNumber
                    ) {
                        listenerHandle.stop();
                        resolve();
                        break;
                    }
                } catch (error) {}
            }
        };

        setupEventListener(network, contractAddress, onLogs, globalConfig.POLLING_INTERVAL_MS)
            .then(handle => {
                listenerHandle = handle;
            })
            .catch(reject);
    });
}

export async function ensureOperatorIsRegistered(): Promise<void> {
    const conceroVerifierNetwork = config.networks.conceroVerifier;
    const { publicClient, walletClient, account } =
        await getFallbackClients(conceroVerifierNetwork);

    const registered = await isOperatorRegistered(publicClient);
    if (registered) {
        logger.info("Operator already registered");
        return;
    }

    const txHash = await requestOperatorRegistration(publicClient, walletClient, account);

    logger.info(`Requested operator registration with txHash ${txHash}`);

    const transaction = await publicClient.getTransaction({ hash: txHash });

    const confirmedTxHash = await waitForOperatorRegistration(
        conceroVerifierNetwork,
        conceroNetworks[conceroVerifierNetwork.name].addresses.conceroVerifier,
        transaction.blockNumber,
        globalConfig.OPERATOR_ADDRESS,
    );

    logger.info(`Operator registration confirmed with txHash ${confirmedTxHash}`);
}
