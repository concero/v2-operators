import { globalConfig } from "../../../constants";
import { DecodedLog } from "../../../types/DecodedLog";
import { callContract, getEnvAddress, logger } from "../../common/utils";
import { config } from "../constants/";

export async function requestCLFMessageReport(log: DecodedLog) {
    // todo:
    //  extract conceroMessageId & srcBlockNumber from ConceroRouter log
    //  request CLF to check the message on the SRC.

    const { chainName, contractAddress, decodedLog } = log;
    const { id, message } = decodedLog.args;

    try {
        const [address] = getEnvAddress("verifierProxy", chainName);

        const hash = await callContract({
            chain: config.networks.conceroVerifier,
            address,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: "requestCLFMessageReport",
            args: [id, message],
        });

        logger.info(`[${chainName}] CLF message report requested with hash: ${hash}`);
    } catch (error) {
        logger.error(`[${chainName}] Error requesting CLF message report:`, error);
    }
}
