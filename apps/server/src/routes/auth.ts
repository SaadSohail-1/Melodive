import type { FastifyPluginAsync } from "fastify";
import { login, register } from "../controllers/auth.controller.js";

const authRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post("/register",{
        schema: {
            body: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                    username: { type: "string", minLength: 3, maxLength: 50 },
                    email: { type: "string", format: "email", maxLength: 255 },
                    password: { type: "string", minLength: 8, maxLength: 128, },
                },
            },
        },
    }, register );

    fastify.post("/login", {
        schema: {
            body: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {type: "string", format: "email"},
                    password: {type: "string", minLength: 8, maxLength: 128},
                },
            },
        }    
    },login)
};

export default authRoutes;

