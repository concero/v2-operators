import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// Define log level based on the environment variable or default to 'info'
const logLevel = process.env.LOG_LEVEL || "info";

// Define common log format with timestamps and pretty print for development
const logFormat = winston.format.combine(
    winston.format.colorize({ level: true }), // Apply color only to the log level
    winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        // Handle object messages properly
        const formattedMessage = typeof message === "object" ? JSON.stringify(message, null, 2) : message;

        // Ensure the meta (which includes defaultMeta like `service`) is handled separately
        const formattedMeta = meta && Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";

        return `${formattedMeta} ${timestamp} [${level}]: ${formattedMessage}`;
    }),
);

// Create the logger instance
const logger = winston.createLogger({
    level: logLevel, // Control log level from environment
    format: winston.format.json(), // Default format is JSON
    transports: [
        new DailyRotateFile({
            filename: "logs/log-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m", // Rotate the log file when it reaches 20MB
            maxFiles: "14d", // Keep logs for the last 14 days
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

// Graceful log level control for dynamic changes in environments
logger.level = logLevel;

export default logger;
