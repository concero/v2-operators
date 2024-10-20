import { DecodedLog } from "../../../types/DecodedLog";
import { getEnvAddress } from "../../../utils/getEnvVar";
import logger from "../../../utils/logger";
import { config } from "../constants/config";
import { callContract } from "../../common/contractCaller/callContract";

export async function requestCLFMessageReport(log: DecodedLog) {
    // todo:
    //  extract conceroMessageId & srcBlockNumber from ConceroRouter log
    //  request CLF to check the message on the SRC.

    const { chainName, contractAddress, decodedLog } = log;

    const { abi: CLFRouterAbi } = await import("../constants/CLFRouter.json");
    const { id, message } = decodedLog.args;

    try {
        const [address] = getEnvAddress("conceroCLFRouter", chainName);

        console.log(`[${chainName}] Requesting CLF message report...`);
        const hash = await callContract({
            chain: config.networks.conceroCLFRouter,
            address,
            abi: CLFRouterAbi,
            functionName: "requestCLFMessageReport",
            args: [id, message],
        });
    } catch (error) {
        logger.error(`[${chainName}] Error requesting CLF message report:`, error);
    }
}
