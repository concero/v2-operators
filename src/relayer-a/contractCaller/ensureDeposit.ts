import { Hash, PublicClient } from "viem";

import { globalConfig } from "../../../constants";
import { callContract, logger } from "../../common/utils";
import { DeploymentManager, NetworkManager, ViemClientManager } from "../../common/managers";

/**
 * @returns {bigint} The minimum deposit amount.
 * @notice Retrieves the minimum required deposit from the conceroVerifier contract.
 */
async function getMinimumDeposit(
    publicClient: PublicClient,
    verifierAddress: `0x${string}`,
): Promise<bigint> {
    const depositAmount = await publicClient.readContract({
        address: verifierAddress,
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
async function getCurrentOperatorDeposit(
    publicClient: PublicClient,
    verifierAddress: `0x${string}`,
): Promise<bigint> {
    const currentDeposit = await publicClient.readContract({
        address: verifierAddress,
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "getOperatorDeposit",
        args: [globalConfig.OPERATOR_ADDRESS],
    });
    return BigInt(currentDeposit);
}

async function fetchDepositAndDepositIfNeeded() {
    const networkManager = NetworkManager.getInstance();
    const viemClientManager = ViemClientManager.getInstance();
    const deploymentManager = DeploymentManager.getInstance();

    const conceroVerifierNetwork = networkManager.getVerifierNetwork();
    const { publicClient, walletClient, account } =
        viemClientManager.getClients(conceroVerifierNetwork);

    const requiredDeposit = (await getMinimumDeposit()) * 200n;
    const currentDeposit = await getCurrentOperatorDeposit();

    if (currentDeposit >= requiredDeposit) {
        logger.info(`Sufficient deposit of ${currentDeposit} already exists`);
        return undefined;
    }

    const txHash = await callContract(publicClient, walletClient, {
        chain: conceroVerifierNetwork.viemChain,
        address: await deploymentManager.getConceroVerifier(),
        abi: globalConfig.ABI.CONCERO_VERIFIER,
        functionName: "operatorDeposit",
        args: [globalConfig.OPERATOR_ADDRESS],
        value: requiredDeposit,
        account,
    });
    logger.info(`Deposited ${requiredDeposit} to ConceroVerifier with hash ${txHash}`);
}

/**
 * @returns {Promise<Hash | undefined>} Transaction hash if deposit was made, undefined if no
 *   deposit was needed.
 * @notice Makes an operator deposit if the current deposit is insufficient.
 */
export async function ensureDeposit() {
    await fetchDepositAndDepositIfNeeded();

    setInterval(async () => {
        await fetchDepositAndDepositIfNeeded();
    }, globalConfig.NOTIFICATIONS.INTERVAL);
}
