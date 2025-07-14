import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import { LoggerConfig } from "../../types/ManagerConfigs";
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
    private config: LoggerConfig;

    private constructor(config: LoggerConfig) {
        super();
        this.config = config;
        this.baseLogger = this.createBaseLogger();
    }

    public static createInstance(config: LoggerConfig): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
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
                    dirname: this.config.logDir,
                    filename: "log-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    maxSize: this.config.logMaxSize,
                    maxFiles: this.config.logMaxFiles,
                }),
                new DailyRotateFile({
                    level: "error",
                    dirname: this.config.logDir,
                    filename: "error-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    maxSize: this.config.logMaxSize,
                    maxFiles: this.config.logMaxFiles,
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
                return this.config.logLevelDefault;
            }

            return this.config.logLevelsGranular[consumerName] || this.config.logLevelDefault;
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
