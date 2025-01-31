import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { globalConfig } from "../../../constants/globalConfig";

const logLevel = globalConfig.LOG_LEVEL;

const logFormat = winston.format.combine(
    winston.format.colorize({ level: true }),
    winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const formattedMessage =
            typeof message === "object" ? JSON.stringify(message, null, 2) : message;
        const formattedMeta = meta && Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";

        return `${formattedMeta} ${timestamp} [${level}]: ${formattedMessage}`;
    }),
);

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.json(),
    transports: [
        new DailyRotateFile({
            filename: "logs/log-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d",
        }),
        new DailyRotateFile({
            level: "error",
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d",
        }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            level: logLevel,
            format: logFormat,
        }),
    );
}

logger.level = logLevel;

export { logger };
