import { eq } from "drizzle-orm";
import { db } from "@melodive/db"
import { jobs } from "@melodive/db"
import { logger } from "../../config/logger.js";

export async function createJob(
    type: string,
    payload: unknown,
    priority = 0,
) {
    const [job] = await db
      .insert(jobs)
      .values({
        type,
        status: "PENDING",
        payload,
        priority,
      }) 
      .returning();

      if(!job) {
        await logger.error("JOB_CREATION_FAILED", {
          details: {
            jobType: type,
          },
          error: new Error("Job could not be created")
        });
        return null;
      }

      await logger.info("JOB_CREATED", {
        details: {
          jobId: job.id,
          jobType: job.type,
        }
      });

    return job;
}

export async function getJob(id: number) {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1)

    return job ?? null;
}