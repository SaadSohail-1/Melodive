import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sessions } from "../../db/schema.js";

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(sessions)
        .values({userId, tokenHash, expiresAt});

    return {
        token,
        expiresAt
    };
}

export async function getSession(token: string) {
    const tokenHash = hashToken(token);

    const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.tokenHash, tokenHash))
        .limit(1);

    if(!session || session.expiresAt <= new Date()) {
        return null;
    }
    
    return session;
}