import { AppErrorEnum, globalConfig } from "../../../constants";
import { AppError, logger } from ".";
import { NetworkManager } from "../managers/NetworkManager";
import { ViemClientManager } from "../managers/ViemClientManager";

const MINIMUM_NATIVE_VALUE = 1_000_000; // 0.001 ETH

export async function checkGas() {
    const viemClientManager = ViemClientManager.getInstance();
    const networkManager = NetworkManager.getInstance();

    const operatorAddress = globalConfig.OPERATOR_ADDRESS;

    try {
        const activeNetworks = networkManager.getActiveNetworks();

        if (activeNetworks.length === 0) {
            logger.warn("No active networks found when checking gas balances");
            return;
        }

        const balancePromises = activeNetworks.map(async network => {
            const { publicClient } = viemClientManager.getClients(network);
            const balance = await publicClient.getBalance({
                address: operatorAddress,
            });

            return { network, balance };
        });

        const balances = await Promise.all(balancePromises);

        balances.forEach(({ network, balance }) => {
            if (balance < MINIMUM_NATIVE_VALUE) {
                throw new AppError(
                    AppErrorEnum.InsufficientGas,
                    Error(
                        `Insufficient gas on ${network.name} (chain ID: ${network.id}). Minimum required: ${MINIMUM_NATIVE_VALUE}, actual: ${balance}`,
                    ),
                );
            }
        });

        logger.info(`All chains (${activeNetworks.length}) have sufficient gas.`);
    } catch (error) {
        logger.error("Error checking gas balances:", error);
        throw error;
    }
}
