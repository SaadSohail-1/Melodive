import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

export async function claimNextJob(
    workerId: string
) {
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
    return result.rows[0] ?? null;
}

export async function completeJob(
    jobId: number,
    result?: unknown
) {
    await db.execute(sql`
        UPDATE jobs
          SET
            status = 'COMPLETED',
            result = ${result ?? null},
            completed_at = NOW(),
            locked_by = NULL,
            locked_at = NULL,
            updated_at = NOW()
          WHERE id = ${jobId};    
    `);
}

export async function failJob(
    jobId: number,
    error: string
) {
    await db.execute(sql`
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
        WHERE id = ${jobId};
    `);
}