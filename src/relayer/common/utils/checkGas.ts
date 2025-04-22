import { activeNetworks, AppErrorEnum, globalConfig } from "../../../constants";
import { AppError, getFallbackClients, logger } from "../utils";

const MINIMUM_NATIVE_VALUE = 1_000_000; // 0.001 ETH

export async function checkGas() {
    const operatorAddress = globalConfig.OPERATOR_ADDRESS;

    try {
        const balancePromises = activeNetworks.map(async (network) => {
            const { publicClient } = await getFallbackClients(network);
            const balance = await publicClient.getBalance({
                address: operatorAddress,
            });

            return { networkId: network.id, balance };
        });

        const balances = await Promise.all(balancePromises);

        balances.forEach(({ networkId, balance }) => {
            if (balance < MINIMUM_NATIVE_VALUE) {
                throw new AppError(
                    AppErrorEnum.InsufficientGas,
                    Error(
                        `Insufficient gas on ${networkId}. Minimum required: ${MINIMUM_NATIVE_VALUE}, actual: ${balance}`,
                    ),
                );
            }
        });

        logger.info("All chains have sufficient gas.");
    } catch (error) {
        logger.error("Error checking gas balances:", error);
        throw error;
    }
}
