import { Address, formatUnits, PublicClient } from "viem";

import { WebClient } from "@slack/web-api";

import { HttpClient, Logger, NetworkManager, ViemClientManager } from "@concero/operator-utils";
import { globalConfig } from "../../constants";

const SAFE_TXS_COUNT_FOR_OPERATOR_BALANCE = 15n;

async function notifyInSlack(message: string) {
    try {
        if (
            !globalConfig.NOTIFICATIONS.SLACK.MONITORING_SYSTEM_CHANNEL_ID ||
            !globalConfig.NOTIFICATIONS.SLACK.BOT_TOKEN
        ) {
            return;
        }

        const webClient = new WebClient(globalConfig.NOTIFICATIONS.SLACK.BOT_TOKEN);

        const res = await webClient.chat.postMessage({
            channel: globalConfig.NOTIFICATIONS.SLACK.MONITORING_SYSTEM_CHANNEL_ID,
            text: message,
        });

        if (!res.ok) {
            console.error(`Failed to send message to slack: ${res.error}`);
        }
    } catch (error) {
        console.error(JSON.stringify(error, null, 2));
    }
}

export async function getChainOperatorMinBalance(publicClient: PublicClient) {
    try {
        const currentGasPrice = await publicClient.getGasPrice();
        const averageTxCostInWei = currentGasPrice * globalConfig.TX_MANAGER.GAS_LIMIT.DEFAULT;

        return averageTxCostInWei * SAFE_TXS_COUNT_FOR_OPERATOR_BALANCE;
    } catch {}
}

async function checkAndNotifyInsufficientGas() {
    const operatorAddress = globalConfig.OPERATOR_ADDRESS;
    const viemClientManager = ViemClientManager.getInstance();
    const networkManager = NetworkManager.getInstance();
    const logger = Logger.getInstance().getLogger("GasChecker");

    try {
        const activeNetworks = networkManager.getActiveNetworks();

        if (activeNetworks.length === 0) {
            logger.warn("No active networks found when checking gas balances");
            return;
        }

        const getNativeBalance = async (publicClient: HttpClient, operatorAddress: Address) => {
            try {
                return await publicClient.getBalance({ address: operatorAddress });
            } catch {}
        };

        const balancePromises = activeNetworks.map(async network => {
            const { publicClient } = viemClientManager.getClients(network);
            const [balance, operatorMinBalance] = await Promise.all([
                getNativeBalance(publicClient, operatorAddress),
                getChainOperatorMinBalance(publicClient),
            ]);

            return { network, balance, operatorMinBalance };
        });

        const chainsInfo = await Promise.all(balancePromises);

        for (const chainInfo of chainsInfo) {
            const { balance, operatorMinBalance, network } = chainInfo;

            if (balance === undefined || operatorMinBalance === undefined) {
                logger.info(`Failed to check balance. Chain ${network.name} is down.`);
                continue;
            }

            if (balance < operatorMinBalance) {
                const message = `Insufficient gas on ${network.name} (chain ID: ${network.id}). Minimum required: ${formatUnits(operatorMinBalance, 18)}, actual: ${formatUnits(balance, 18)}`;

                await notifyInSlack(message);
                logger.info(message);
            }
        }

        // balances.forEach(({ network, balance, operatorMinBalance }) => {
        // if (balance < operatorMinBalance) {
        // throw new AppError(
        //     AppErrorEnum.InsufficientGas,
        //     Error(
        //         `Insufficient gas on ${network.name} (chain ID: ${network.id}). Minimum required: ${operatorMinBalance}, actual: ${balance}`,
        //     ),
        // );
        // }
        // });

        // logger.info(`All chains (${activeNetworks.length}) have sufficient gas.`);
    } catch (error) {
        logger.error("Error checking gas balances:", error);
    }
}

export async function checkGas() {
    await checkAndNotifyInsufficientGas();

    setInterval(async () => {
        await checkAndNotifyInsufficientGas();
    }, globalConfig.NOTIFICATIONS.INTERVAL);
}
