import {appendFile, mkdir} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
    LogEntry,
    LogLevel,
    LogSource,
    LogOptions
} from "./types.js";

interface LoggerOptions {
    source: LogSource;
    level?: LogLevel;
    logDirectory?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

export class Logger {
    private readonly source: LogSource;
    private readonly level: LogLevel;
    private readonly logFile: string;

    private writeQueue = Promise.resolve();

    constructor(options: LoggerOptions) {
        this.source = options.source;
        this.level = options.level ?? "INFO";

        const logDirectory = options.logDirectory ?? "logs";

        this.logFile = path.join(logDirectory, `${this.source}.jsonl`);

        console.log("LOGGER FILE:", path.resolve(this.logFile));
    }

    private shouldLog(level: LogLevel): boolean {
        return (
            LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level]
        )
    }

    private async write(entry: LogEntry): Promise<void> {
        if(!this.shouldLog(entry.level)) {
            return;
        }
        this.writeQueue = this.writeQueue.then(async () => {
            const directory = path.dirname(this.logFile);
            
            await mkdir(directory, {
                recursive: true
            });
            
            await appendFile(
                this.logFile,
                JSON.stringify(entry) + "\n",
                "utf-8"
            );
        })
    }

    private serializeError(error: unknown): Record<string, unknown> {
        if(error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        return {
            value: error
        }
    }

    async debug(
        event: string,
        options?: LogOptions
    ): Promise<void> {
        await this.log("DEBUG", event, options);
    }

    async info(
        event: string,
        options?: LogOptions
    ): Promise<void> {
        await this.log("INFO", event, options);
    }

    async warn(
        event: string,
        options?: LogOptions
    ): Promise<void> {
        await this.log("WARN", event, options);
    }

    async error(
        event: string,
        options?: LogOptions
    ): Promise<void> {
        await this.log("ERROR", event, options);
    }

    private async log(
        level: LogLevel,
        event: string,
        options?: LogOptions
    ): Promise<void> {
        const details = {
            ...options?.details,
            ...(options?.error !== undefined)
              ? {error: this.serializeError(options.error)}
              : {}
        };
        const entry: LogEntry = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            level,
            source: this.source,
            event,
            ...(Object.keys(details).length > 0
              ? { details }
              : {})
        }

        await this.write(entry);
    }
}