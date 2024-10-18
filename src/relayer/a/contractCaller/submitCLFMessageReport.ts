import { DecodedLog } from "../../../types/DecodedLog";
import { conceroNetworks } from "../../../constants";
import { getEnvAddress } from "../../../utils/getEnvVar";
import logger from "../../../utils/logger";
import { getFallbackClients } from "../../../utils/getViemClients";

export async function submitCLFMessageReport(log: DecodedLog) {
    //todo:
    // get srcBlockNumber and ConceroMessageId from CLFMessageReport log
    // fetch message from SRC
    // (optional) verify that message data hash matches the hash in the CLFMessageReport
    // send CLF report with message data to DST ConceroRouter

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
