import { randomUUID } from "node:crypto";
import { claimNextJob, completeJob, failJob } from "./jobs/job.worker.js";

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
                console.log(`Processing SCAN_LIBRARY job #${job.id}`)
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))