import type { FastifyPluginAsync } from "fastify";
import { createJob } from "../services/jobs/job.service.js";

const libraryRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post("/scan", {
        schema: {
            body: {
                type: "object",
                required: ["path"],
                properties: {
                    path: {
                        type: "string", minLength: 1,
                    },
                },
            },
        },
    }, async (request, reply) => {
        const body = request.body as {
            path?: string
        };

        const job = await createJob(
            "SCAN_LIBRARY",
            {
                path: body.path,
            },
        );

        return reply.code(202).send({
            job_id: job?.id,
            status: job?.status,
        });
    });
}

export default libraryRoutes;