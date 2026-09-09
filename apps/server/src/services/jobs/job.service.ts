import { eq } from "drizzle-orm";
import { db } from "../../db/index.js"
import { jobs } from "../../db/schema.js"

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