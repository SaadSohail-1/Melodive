import type { FastifyReply, FastifyRequest } from "fastify";
import * as userService from "../services/user/user.service.js";

export async function getMe(
    request: FastifyRequest,
    reply: FastifyReply
) {
    return reply.code(200).send({
        success: true,
        data: {
            userId: request.user
        }
    })
}

export async function getPlaybackState(
    request: FastifyRequest,
    reply: FastifyReply
) { 
    if(!request.user) return null;
    const result = await userService.getPlaybackState(request.user);
    if(!result) return reply.code(404).send({
        data: []
    })
    return reply.code(200).send({
        success: true,
        data: {
            trackId: result.trackId,
            positionSeconds: result.positionSeconds,
            isPlaying: result.isPlaying
        }
    });
}

export type setPlaybackStateBody = {
    trackId: string;
    positionSeconds: string;
}

export async function setPlaybackState(
    request: FastifyRequest<{Body: setPlaybackStateBody}>,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const {trackId, positionSeconds} = request.body;
    
    await userService.setPlaybackState(
        request.user, 
        trackId, 
        positionSeconds
    );

    return reply.code(200).send({
        success: true,
        message: "Playback state saved"
    })
}
