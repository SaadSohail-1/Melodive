import type { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, registerUser } from "../services/auth/auth.service.js";
import { createSession } from "../services/auth/session.service.js";

type RegisterBody = {
    username: string;
    email: string;
    password: string;
}

type LoginBody = {
    email: string;
    password: string;
}

export async function register(
    request: FastifyRequest<{Body: RegisterBody}>,
    reply: FastifyReply
) {
    const {username, email, password} = request.body;

    const user = await registerUser(username, email, password);

    return reply.code(201).send({
        user,
    });
}

export async function login(
    request: FastifyRequest<{Body: LoginBody}>,
    reply: FastifyReply,
) {
    const {email, password} = request.body;
    const user = await loginUser(email, password);
    if(!user) {
        return reply.code(401).send({
            error: "Invalid email or password",
        });
    }

    const session = await createSession(user.id);

    reply.setCookie("session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: session.expiresAt
    });
    
    return reply.send({user});
}