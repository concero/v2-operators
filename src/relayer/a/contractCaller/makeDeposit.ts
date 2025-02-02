import { Hash } from "viem";
import { conceroNetworks, globalConfig } from "../../../constants";
import { callContract, getFallbackClients, logger } from "../../common/utils";
import { config } from "../constants";

/**
 * @returns {bigint} The minimum deposit amount.
 * @notice Retrieves the minimum required deposit from the conceroVerifier contract.
 */
async function getMinimumDeposit(): Promise<bigint> {
    const conceroVerifierNetwork = config.networks.conceroVerifier;
    const { publicClient } = await getFallbackClients(conceroVerifierNetwork);
    const depositAmount = await publicClient.readContract({
        chain: conceroVerifierNetwork.viemChain,
        address: conceroNetworks[conceroVerifierNetwork.name].addresses.conceroVerifier,
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "getCLFDeposit",
        args: [],
    });
    return BigInt(depositAmount);
}

/** @notice Makes an operator deposit using the minimum required deposit amount. */
async function makeDeposit(): Promise<Hash | undefined> {
    const conceroVerifierNetwork = config.networks.conceroVerifier;
    const { publicClient, walletClient, account } =
        await getFallbackClients(conceroVerifierNetwork);
    const depositAmount = await getMinimumDeposit();
    const txHash = await callContract(publicClient, walletClient, {
        chain: conceroVerifierNetwork.viemChain,
        address: conceroNetworks[conceroVerifierNetwork.name].addresses.conceroVerifier,
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "operatorDeposit",
        args: [globalConfig.OPERATOR_ADDRESS],
        value: depositAmount,
        account,
    });
    logger.info(`Deposited ${depositAmount} to ConceroVerifier with hash ${txHash}`);
    return txHash;
}

export { makeDeposit };
