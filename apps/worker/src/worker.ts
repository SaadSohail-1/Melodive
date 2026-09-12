import { randomUUID } from "node:crypto";
import { claimNextJob, completeJob, failJob } from "./jobs/job.worker.js";
import { processScanLibraryJob } from "./jobs/scan-library.js";
import { processFetchArtworkJob } from "./jobs/fetch-artwork.js";

const workerId = randomUUID();

export async function startWorker() {
   console.log(`Melodive worker started: ${workerId}`);

   while(true) {
    const job = await claimNextJob(workerId);
    if(!job) {
        await sleep(5000);
        continue;
    }

    console.log(`Processing job #${job.id} (${job.type})`);

    try {
        switch (job.type) {
            case "SCAN_LIBRARY":
                console.log(`Processing SCAN_LIBRARY job #${job.id}`);
                const payload = job.payload as {path?: string; name?: string};
                if(!payload || typeof payload.path !== "string") {
                    throw new Error("Job payload is missing the 'path' string.");
                } 
                const result = await processScanLibraryJob(payload.path);
                console.log(`Job #${job.id} Pipeline results:`, result);
                break;
            case "FETCH_ARTWORK":
                await processFetchArtworkJob(job.payload);
                break;
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }
        await completeJob(job.id);

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Job #${job.id} failed`, message);
        await failJob(job.id, message);
    }


   }
}

startWorker().catch((err) => {
    console.error("Fatal worker error: ", err);
    process.exit(1);
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))