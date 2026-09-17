import { db } from "@melodive/db";
import { eq, sql } from "drizzle-orm";
import { jobs } from "@melodive/db/schema";
import { logger } from "../config/logger.js";
import type { InferSelectModel } from "drizzle-orm";

type Job = InferSelectModel<typeof jobs>;

export async function claimNextJob(
    workerId: string
): Promise<Job | null> {
    const result = await db.execute(sql`
        WITH next_job AS (
          SELECT id
          FROM jobs
          WHERE status = 'PENDING'
            AND (run_at IS NULL OR run_at <= NOW())
          ORDER BY priority DESC, created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE jobs
        SET
          status = 'PROCESSING',
          locked_at = NOW(),
          locked_by = ${workerId},
          started_at = NOW(),
          attempts = attempts + 1,
          updated_at = NOW()
        FROM next_job
        WHERE jobs.id = next_job.id
        RETURNING jobs.*;
    `);
    const job = (result.rows[0] as Job | undefined) ?? null; 

    if(job) {
      await logger.info("JOB_CLAIMED", {
        details: {
          jobId: job.id,
          jobType: job.type,
          workerId
        }
      })
    }
    return job;
}

export async function completeJob(
    jobId: number,
    result?: unknown
) {
    await db
    .update(jobs)
    .set({
      status: "COMPLETED",
      result: result || null, 
      completedAt: new Date(),
      lockedBy: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

    await logger.info("JOB_COMPLETED", {
      details: {
        jobId: jobId
      }
    })
}

export async function failJob(
    jobId: number,
    error: string
) {
    const result = await db.execute(sql`
        UPDATE jobs
        SET
          status = CASE
            WHEN attempts < max_retries
              THEN 'PENDING'
            ELSE 'FAILED'
          END,
          error_message = ${error},
          locked_at = NULL,
          locked_by = NULL,
          updated_at = NOW()
        WHERE id = ${jobId}
        RETURNING id, status, attempts, max_retries;
    `);

    const job = result.rows[0] as {
      id: number,
      status: string,
      attempts: number,
      max_retries: number
    } | undefined;

    if(!job) {
      await logger.error("JOB_FAILURE_UPDATE_FAILED", {
        details: {
          jobId
        },
        error: new Error(`Could not update failed job ${jobId}`)
      })
      return;
    }
    
    await logger.error("JOB_FAILED", {
      details: {
        jobId: job.id,
        jobStatus: job.status,
        attempts: job.attempts,
        maxRetries: job.max_retries
      },
      error
    })
}