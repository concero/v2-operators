import { globalConfig } from "../../../constants";
import { logger } from "../utils";
import { networkManager } from "../managers/NetworkManager";
import { viemClientManager } from "../../common/managers/ViemClientManager";
import { getChainOperatorMinBalance } from "./getChainOperatorMinBalance";
import { WebClient } from "@slack/web-api";
import { formatUnits } from "viem";

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

async function checkAndNotifyInsufficientGas() {
    const operatorAddress = globalConfig.OPERATOR_ADDRESS;

    try {
        const activeNetworks = networkManager.getActiveNetworks();

        if (activeNetworks.length === 0) {
            logger.warn("No active networks found when checking gas balances");
            return;
        }

        const balancePromises = activeNetworks.map(async network => {
            const { publicClient } = viemClientManager.getClients(network);
            const [balance, operatorMinBalance] = await Promise.all([
                publicClient.getBalance({
                    address: operatorAddress,
                }),
                getChainOperatorMinBalance(network),
            ]);

            return { network, balance, operatorMinBalance };
        });

        const chainsInfo = await Promise.all(balancePromises);

        for (const chainInfo of chainsInfo) {
            const { balance, operatorMinBalance, network } = chainInfo;

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
        throw error;
    }
}

export async function checkGas() {
    await checkAndNotifyInsufficientGas();

    setInterval(async () => {
        await checkAndNotifyInsufficientGas();
    }, globalConfig.NOTIFICATIONS.INTERVAL);
}
