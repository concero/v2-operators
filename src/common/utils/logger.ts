import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import { globalConfig } from "../../constants/globalConfig";
import { ManagerBase } from "../managers/ManagerBase";

export interface LoggerInterface {
    error(message: any, ...meta: any[]): void;
    warn(message: any, ...meta: any[]): void;
    info(message: any, ...meta: any[]): void;
    debug(message: any, ...meta: any[]): void;
}

export class Logger extends ManagerBase {
    private static instance: Logger;
    private baseLogger: winston.Logger;
    private consumerLoggers: Map<string, LoggerInterface> = new Map();

    private constructor() {
        super();
        this.baseLogger = this.createBaseLogger();
    }

    public static createInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            throw new Error("Logger is not initialized. Call createInstance() first.");
        }
        return Logger.instance;
    }

    private createBaseLogger(): winston.Logger {
        const logFormat = winston.format.combine(
            winston.format.colorize({ level: true }),
            winston.format.timestamp({
                format: "MM-DD HH:mm:ss",
            }),
            winston.format.printf(({ level, message, timestamp, consumer, ...meta }) => {
                const prefix = consumer ? `${consumer}` : "";
                const formattedMessage =
                    typeof message === "object" ? JSON.stringify(message, null, 2) : message;
                const formattedMeta =
                    meta && Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";

                return `${timestamp} ${level} ${prefix}: ${formattedMessage} ${formattedMeta}`.trim();
            }),
        );

        const logger = winston.createLogger({
            level: "debug", // Allow all logs through at base logger level
            format: winston.format.json(),
            transports: [
                new DailyRotateFile({
                    level: "debug",
                    dirname: globalConfig.LOGGER.LOG_DIR,
                    filename: "log-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    maxSize: globalConfig.LOGGER.LOG_MAX_SIZE,
                    maxFiles: globalConfig.LOGGER.LOG_MAX_FILES,
                }),
                new DailyRotateFile({
                    level: "error",
                    dirname: globalConfig.LOGGER.LOG_DIR,
                    filename: "error-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    maxSize: globalConfig.LOGGER.LOG_MAX_SIZE,
                    maxFiles: globalConfig.LOGGER.LOG_MAX_FILES,
                }),
            ],
        });

        if (process.env.NODE_ENV !== "production") {
            logger.add(
                new winston.transports.Console({
                    level: "debug",
                    format: logFormat,
                }),
            );
        }

        return logger;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;
        super.initialize();
        this.getLogger("Logger").info("Initialized");
    }

    public getLogger(consumerName?: string): LoggerInterface {
        const cacheKey = consumerName || "__default__";

        if (this.consumerLoggers.has(cacheKey)) {
            return this.consumerLoggers.get(cacheKey)!;
        }

        const logger = this.createConsumerLogger(consumerName);
        this.consumerLoggers.set(cacheKey, logger);
        return logger;
    }

    private createConsumerLogger(consumerName?: string): LoggerInterface {
        const getLogLevel = (): string => {
            if (!consumerName) {
                return globalConfig.LOGGER.LOG_LEVEL_DEFAULT;
            }

            return (
                globalConfig.LOGGER.LOG_LEVELS_GRANULAR[consumerName] ||
                globalConfig.LOGGER.LOG_LEVEL_DEFAULT
            );
        };

        // Map log levels to numeric values for comparison
        const logLevelValue: Record<string, number> = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
        };

        // Only log if the message level is <= configured level
        const shouldLog = (messageLevel: string): boolean => {
            const configuredLevel = getLogLevel();
            const configLevelValue = logLevelValue[configuredLevel] || 2; // Default to info
            const messageLevelValue = logLevelValue[messageLevel] || 0; // Default to error

            return messageLevelValue <= configLevelValue;
        };

        const logLevel = getLogLevel();

        return {
            error: (message: any, ...meta: any[]) => {
                this.baseLogger.error(
                    message,
                    consumerName ? { consumer: consumerName, ...meta } : meta,
                );
            },
            warn: (message: any, ...meta: any[]) => {
                if (shouldLog("warn")) {
                    this.baseLogger.warn(
                        message,
                        consumerName ? { consumer: consumerName, ...meta } : meta,
                    );
                }
            },
            info: (message: any, ...meta: any[]) => {
                if (shouldLog("info")) {
                    this.baseLogger.info(
                        message,
                        consumerName ? { consumer: consumerName, ...meta } : meta,
                    );
                }
            },
            debug: (message: any, ...meta: any[]) => {
                if (shouldLog("debug")) {
                    this.baseLogger.debug(
                        message,
                        consumerName ? { consumer: consumerName, ...meta } : meta,
                    );
                }
            },
        };
    }

    public override dispose(): void {
        this.consumerLoggers.clear();
        super.dispose();
    }
}
