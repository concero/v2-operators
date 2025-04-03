import { activeNetworks, AppErrorEnum, globalConfig } from "../../../constants";
import { AppError, getFallbackClients, logger } from "../utils";

const MINIMUM_NATIVE_VALUE = 1_000_000; // 0.001 ETH

export async function checkGas() {
    const networkIds = globalConfig.WHITELISTED_NETWORK_IDS[globalConfig.NETWORK_MODE];
    const operatorAddress = globalConfig.OPERATOR_ADDRESS;

    try {
        const balancePromises = networkIds.map(async networkId => {
            const chain = activeNetworks.find(network => network.id === networkId);
            if (!chain) {
                console.log(`chain ${networkId} not found\n\n\n`);
                throw new AppError(AppErrorEnum.ChainNotFound);
            }

            const { publicClient } = await getFallbackClients(chain);
            const balance = await publicClient.getBalance({
                address: operatorAddress,
            });

            return { networkId, balance };
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
