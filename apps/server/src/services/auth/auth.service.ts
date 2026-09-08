import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";
import { hashPassword, verifyPassword } from "./password.js";
import { db } from "../../db/index.js";

export async function registerUser(
    username: string,
    email: string,
    password: string,
) {
    const passwordHash = await hashPassword(password);

    const [user] = await db
        .insert(users)
        .values({
            username,
            email,
            passwordHash
        })
        .returning({
            id: users.id,
            username: users.username,
            email: users.email
        })
    return user;
}

export async function loginUser(
    email: string,
    password: string
) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (!user) return null;

    const validPassword = await verifyPassword(
        user.passwordHash,
        password
    );

    if(!validPassword) return null;

    return {
        id: user.id,
        username: user.username,
        email: user.email,
    };
}