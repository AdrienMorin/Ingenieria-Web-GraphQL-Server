import { createSchema } from 'graphql-yoga'
import {compare, hash} from "bcryptjs";
import { sign } from "jsonwebtoken";
import {APP_SECRET} from "./auth";
import {GraphQLContext} from "@/context";
import prisma from "../lib/prisma";

const typeDefinitions = /* GraphQL */ `
    type Query {
        info: String!
        feed: [Post!]!
        me: User!
    }
    type Mutation {
        post(url: String!, description: String!): Post!
        signup(email: String!, password: String!, name: String!): AuthPayload
        login(email: String!, password: String!): AuthPayload
    }
    type Post {
        id: ID!
        title: String!
        content: String!
    }
    type AuthPayload {
        token: String
        user: User
    }

    type User {
        id: ID!
        name: String!
        email: String!
        posts: [Post!]!
    }
`

const resolvers = {
    Query: {
        info: (parent: unknown, context: GraphQLContext) => 'Hello World!',
        me: (parent: unknown, args: {}, context: GraphQLContext) => {
            if (context.currentUser === null) {
                throw new Error("Unauthenticated!");
            }

            return context.currentUser;
        },
    },
    Mutation: {
        signup: async (
            parent: unknown,
            args: { email: string; password: string; name: string },
            context: GraphQLContext
        ) => {
            // 1
            const password = await hash(args.password, 10);

            // 2
            const user = await context.prisma.user.create({
                data: { ...args, password },
            });

            // 3
            const token = sign({ userId: user.id }, APP_SECRET);

            // 4
            return {
                token,
                user,
            };
        },
        login: async (
            parent: unknown,
            args: { email: string; password: string },
            context: GraphQLContext
        ) => {
            // 1
            const user = await context.prisma.user.findUnique({
                where: { email: args.email },
            });
            if (!user) {
                throw new Error("No such user found");
            }

            // 2
            const valid = await compare(args.password, user.password);
            if (!valid) {
                throw new Error("Invalid password");
            }

            const token = sign({ userId: user.id }, APP_SECRET);

            // 3
            return {
                token,
                user,
            };
        },
    }
}

export const schema = createSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinitions]
})
