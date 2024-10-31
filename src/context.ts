import { PrismaClient, User } from "@prisma/client";
import prisma from "../lib/prisma";
import {FastifyRequest} from "fastify";
import {authenticateUser} from "./auth";

export type GraphQLContext = {
    prisma: PrismaClient;
    currentUser: User | null;
};

export async function contextFactory(
    request: FastifyRequest
): Promise<GraphQLContext> {
    return {
        prisma,
        currentUser: await authenticateUser(prisma, request),
    };
}

