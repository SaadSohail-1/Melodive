import { Logger } from "@melodive/logger";

export const logger = new Logger({
    source: "server",
    logDirectory: "../../logs"
});