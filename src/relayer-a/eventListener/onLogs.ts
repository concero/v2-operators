import { Log, decodeEventLog, getAbiItem } from "viem";

import { logger } from "../../common/utils";

import { globalConfig } from "../../constants";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { DecodedLog } from "../../types/DecodedLog";
import { requestCLFMessageReport } from "../businessLogic/requestCLFMessageReport";
import { submitCLFMessageReport } from "../businessLogic/submitCLFMessageReport";

/**
 * Handle ConceroMessageSent events from ConceroRouter.
 * This is triggered when a message is sent from a source chain.
 */
export async function onRouterConceroSentLogs(logs: Log[], network: ConceroNetwork) {
    if (logs.length === 0) return;

    logger.info(
        `[onRouterConceroSentLogs] Processing ${logs.length} ConceroMessageSent logs from ${network.name}`,
    );

    for (const log of logs) {
        try {
            let decodedData;
            try {
                const sentEvent = getAbiItem({
                    abi: globalConfig.ABI.CONCERO_ROUTER,
                    name: "ConceroMessageSent",
                });
                decodedData = decodeEventLog({
                    abi: [sentEvent],
                    data: log.data,
                    topics: log.topics as any,
                });
            } catch (decodeError) {
                logger.error(`[onRouterConceroSentLogs] Failed to decode log: `, decodeError);
                continue;
            }

            const args = decodedData ? decodedData.args : null;
            let messageId: any;
            let message: any;
            let version: any;
            let shouldFinaliseSrc: any;
            let dstChainSelector: any;
            let dstChainData: any;
            let sender: any;

            try {
                if (!args || typeof args !== "object") {
                    throw new Error("Invalid args for ConceroMessageSent event");
                }
                messageId = args.messageId;
                message = args.message;
                version = args.version;
                shouldFinaliseSrc = args.shouldFinaliseSrc;
                dstChainSelector = args.dstChainSelector;
                dstChainData = args.dstChainData;
                sender = args.sender;
            } catch (ex) {
                messageId = log.topics[1];
                message = "0x";
                version = 0;
                shouldFinaliseSrc = false;
                dstChainSelector = "0";
                dstChainData = "0x";
                sender = "0x0000000000000000000000000000000000000000";
            }

            logger.info(
                `[onRouterConceroSentLogs] Processing messageId: ${messageId} from ${network.name}`,
            );

            const decodedLog: DecodedLog = {
                ...(log as any),
                args: {
                    messageId,
                    message,
                    version,
                    shouldFinaliseSrc,
                    dstChainSelector,
                    dstChainData,
                    sender,
                },
                eventName: "ConceroMessageSent",
            };

            await requestCLFMessageReport(decodedLog, network.chainSelector);
        } catch (error) {
            logger.error(
                `[onRouterConceroSentLogs] Error processing log on ${network.name}:`,
                error,
            );
        }
    }
}

/**
 * Handle ConceroMessageReceived events from ConceroRouter.
 * This is triggered when a message is received on a destination chain.
 */
export async function onRouterConceroReceivedLogs(logs: Log[], network: ConceroNetwork) {
    if (logs.length === 0) return;

    logger.info(
        `[onRouterConceroReceivedLogs] Processing ${logs.length} ConceroMessageReceived logs from ${network.name}`,
    );

    for (const log of logs) {
        try {
            let decodedData;
            try {
                const receivedEvent = getAbiItem({
                    abi: globalConfig.ABI.CONCERO_ROUTER,
                    name: "ConceroMessageReceived",
                });
                decodedData = decodeEventLog({
                    abi: [receivedEvent],
                    data: log.data,
                    topics: log.topics as any,
                });
            } catch (decodeError) {
                logger.error(`[onRouterConceroReceivedLogs] Failed to decode log: `, decodeError);
                continue;
            }

            const args = decodedData ? decodedData.args : null;
            let messageId: any;

            try {
                if (!args || typeof args !== "object") {
                    throw new Error("Invalid args for ConceroMessageReceived event");
                }
                messageId = args.id;
            } catch (ex) {
                messageId = log.topics[1];
            }

            logger.info(
                `[onRouterConceroReceivedLogs] Message received with ID: ${messageId} on ${network.name}`,
            );
        } catch (error) {
            logger.error(
                `[onRouterConceroReceivedLogs] Error processing log on ${network.name}:`,
                error,
            );
        }
    }
}

/**
 * Handle MessageReportRequested events from ConceroVerifier.
 * This is triggered when a message report is requested from the verifier.
 */
export async function onVerifierMessageReportRequestedLogs(logs: Log[], network: ConceroNetwork) {
    if (logs.length === 0) return;

    logger.info(
        `[onVerifierMessageReportRequestedLogs] Processing ${logs.length} MessageReportRequested logs`,
    );

    for (const log of logs) {
        try {
            let decodedData;
            try {
                const requestedEvent = getAbiItem({
                    abi: globalConfig.ABI.CONCERO_VERIFIER,
                    name: "MessageReportRequested",
                });
                decodedData = decodeEventLog({
                    abi: [requestedEvent],
                    data: log.data,
                    topics: log.topics as any,
                });
            } catch (decodeError) {
                logger.error(
                    `[onVerifierMessageReportRequestedLogs] Failed to decode log: `,
                    decodeError,
                );
                continue;
            }

            const args = decodedData ? decodedData.args : null;
            let messageId: any;

            try {
                if (!args || typeof args !== "object") {
                    throw new Error("Invalid args for MessageReportRequested event");
                }
                messageId = args.messageId;
            } catch (ex) {
                messageId = log.topics[1];
            }

            logger.info(
                `[onVerifierMessageReportRequestedLogs] Report requested for messageId: ${messageId}`,
            );
        } catch (error) {
            logger.error(`[onVerifierMessageReportRequestedLogs] Error processing log:`, error);
        }
    }
}

/**
 * Handle MessageReport events from ConceroVerifier.
 * This is triggered when a message report is generated by the verifier.
 */
export async function onVerifierMessageReportLogs(logs: Log[], network: ConceroNetwork) {
    if (logs.length === 0) return;

    logger.info(`[onVerifierMessageReportLogs] Processing ${logs.length} MessageReport logs`);

    for (const log of logs) {
        try {
            let decodedData;
            try {
                const reportEvent = getAbiItem({
                    abi: globalConfig.ABI.CONCERO_VERIFIER,
                    name: "MessageReport",
                });
                decodedData = decodeEventLog({
                    abi: [reportEvent],
                    data: log.data,
                    topics: log.topics as any,
                });
            } catch (decodeError) {
                logger.error(`[onVerifierMessageReportLogs] Failed to decode log: `, decodeError);
                continue;
            }

            const args = decodedData ? decodedData.args : null;
            let messageId: any;

            try {
                if (!args || typeof args !== "object") {
                    throw new Error("Invalid args for MessageReport event");
                }
                messageId = args.messageId;
            } catch (ex) {
                messageId = log.topics[1];
            }

            logger.info(
                `[onVerifierMessageReportLogs] Report available for messageId: ${messageId}`,
            );

            const decodedLog: DecodedLog = {
                ...(log as any),
                args: {
                    messageId,
                },
                eventName: "MessageReport",
            };

            await submitCLFMessageReport(decodedLog);
        } catch (error) {
            logger.error(`[onVerifierMessageReportLogs] Error processing log:`, error);
        }
    }
}
