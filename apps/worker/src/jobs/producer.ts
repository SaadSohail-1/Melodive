import { db } from "@melodive/db";
import { jobs } from "@melodive/db";

export async function enqueueJob (
    type: string,
    payload: unknown,
    priority = 0
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

    return job;
}