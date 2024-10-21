import { DecodedLog } from "../../../types/DecodedLog";
import { conceroNetworks } from "../../../constants";
import { getFallbackClients } from "../../../utils/getViemClients";
import { decodeCLFReport } from "../../../utils/decodeCLFReport";

export async function submitCLFMessageReport(log: DecodedLog) {
    //todo:
    // get srcBlockNumber and ConceroMessageId from CLFMessageReport log
    // fetch message from SRC
    // (optional) verify that message data hash matches the hash in the CLFMessageReport
    // send CLF report with message data to DST ConceroRouter

    const { chainName, address, transactionHash, decodedLog } = log;
    const { id } = decodedLog.args;

    const { publicClient } = getFallbackClients(conceroNetworks[chainName]);
    const tx = await publicClient.getTransaction({ hash: transactionHash });

    console.log(tx);
    console.log(`Submitting CLF message report for message ID: ${id}`);
    const decodedCLFReport = decodeCLFReport(tx);
    console.log(decodedCLFReport);
    // const hash = await callContract({
    //     chain,
    //     address,
    //     abi: conceroRouterAbi,
    //     functionName: "submitMessageReport",
    //     args: [ccipMessageId],
    // });
}
//
// async function test() {
//     const { publicClient } = getFallbackClients(conceroNetworks["base"]);
//     const tx = await publicClient.getTransaction({
//         hash: "0x3018db9bf3525621578311b8ee09b5f735bc68dfbfd2142154b671ece68691a1",
//     });
//
//     const decodedCLFReport = decodeCLFReport(tx);
//
//     console.log(decodedCLFReport);
// }
// test();
