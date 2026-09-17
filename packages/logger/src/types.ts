export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export type LogSource = "server" | "worker";

export interface LogEntry {
    id: string
    timestamp: string;
    level: LogLevel;
    source: LogSource;
    event: string;
    details?: Record<string, unknown>;
}

export interface LogOptions{
    details?: Record<string, unknown>;
    error?: unknown
}