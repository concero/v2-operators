import { Hash } from "viem";
import { globalConfig } from "../../../constants";
import { callContract, logger } from "../../common/utils";
import { deploymentsManager } from "../../common/managers/DeploymentManager";
import { networkManager } from "../../common/managers/NetworkManager";
import { viemClientManager } from "../../common/managers/ViemClientManager";
/**
 * @returns {bigint} The minimum deposit amount.
 * @notice Retrieves the minimum required deposit from the conceroVerifier contract.
 */

async function getMinimumDeposit(): Promise<bigint> {
    const conceroVerifierNetwork = networkManager.getVerifierNetwork();
    const { publicClient } = viemClientManager.getClients(conceroVerifierNetwork);
    const depositAmount = await publicClient.readContract({
        chain: conceroVerifierNetwork.viemChain,
        address: await deploymentsManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "getMinimumOperatorDeposit",
        args: [],
    });
    return BigInt(depositAmount);
}

/**
 * @returns {Promise<bigint>} The current operator deposit amount.
 * @notice Retrieves the current deposit amount for the operator.
 */
async function getCurrentOperatorDeposit(): Promise<bigint> {
    const conceroVerifierNetwork = networkManager.getVerifierNetwork();
    const { publicClient } = viemClientManager.getClients(conceroVerifierNetwork);
    const currentDeposit = await publicClient.readContract({
        chain: conceroVerifierNetwork.viemChain,
        address: await deploymentsManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "getOperatorDeposit",
        args: [globalConfig.OPERATOR_ADDRESS],
    });
    return BigInt(currentDeposit);
}

/**
 * @returns {Promise<Hash | undefined>} Transaction hash if deposit was made, undefined if no
 *   deposit was needed.
 * @notice Makes an operator deposit if the current deposit is insufficient.
 */
async function ensureDeposit(): Promise<Hash | undefined> {
    const conceroVerifierNetwork = networkManager.getVerifierNetwork();
    const { publicClient, walletClient, account } =
        viemClientManager.getClients(conceroVerifierNetwork);

    const requiredDeposit = (await getMinimumDeposit()) * 200n;
    const currentDeposit = await getCurrentOperatorDeposit();

    if (currentDeposit >= requiredDeposit) {
        logger.info(`Sufficient deposit of ${currentDeposit} already exists`);
        return undefined;
    }

    const { transactionHash } = await callContract(publicClient, walletClient, {
        chain: conceroVerifierNetwork.viemChain,
        address: await deploymentsManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "operatorDeposit",
        args: [globalConfig.OPERATOR_ADDRESS],
        value: requiredDeposit,
        account,
    });
    logger.info(`Deposited ${requiredDeposit} to ConceroVerifier with hash ${transactionHash}`);
    return transactionHash;
}

export { ensureDeposit };
