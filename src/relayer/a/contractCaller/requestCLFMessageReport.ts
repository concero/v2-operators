import { DecodedLog } from "../../../types/DecodedLog";
import { conceroNetworks } from "../../../constants";
import { getEnvAddress } from "../../../utils/getEnvVar";
import logger from "../../../utils/logger";
import { getFallbackClients } from "../../../utils/getViemClients";

export async function requestCLFMessageReport(log: DecodedLog) {
    // todo:
    //  extract conceroMessageId & srcBlockNumber from ConceroRouter log
    //  request CLF to check the message on the SRC.

    const { chainName, contractAddress, decodedLog } = log;

    const { publicClient } = getFallbackClients(conceroNetworks.base);
    const tx = await publicClient.getTransaction({ hash: log });

    const { ccipMessageId } = decodedLog.args;
    try {
        const chain = conceroNetworks[chainName];
        const [address] = getEnvAddress("conceroCLFRouter", chainName);
        console.log(`Requesting CLF message report for message ID: ${ccipMessageId}`);

        // const hash = await callContract({
        //     chain,
        //     address,
        //     abi: conceroRouterAbi,
        //     functionName: "requestCLFMessageReport",
        //     args: [ccipMessageId],
        // });
    } catch (error) {
        logger.error(`[${chainName}] Error requesting CLF message report:`, error);
    }
}
