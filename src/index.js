import { createSchema, createYoga } from 'graphql-yoga';
import { PrismaClient } from '@prisma/client';
import { PubSub } from 'graphql-subscriptions';
import { createServer } from 'node:http';
import fs from 'fs';
import Query from './resolvers/Query.js';
import Mutation from './resolvers/Mutation.js';
import Subscription from './resolvers/Subscription.js';
import User from './resolvers/User.js';

const prisma = new PrismaClient();
export const pubsub = new PubSub();

// Read the schema from a file
const typeDefs = fs.readFileSync('./src/schema.graphql', 'utf8');
const resolvers = {
  Query,
  Mutation,
  Subscription,
  User,
};

// Create a context function that returns the token from the request headers HTTP
const getHttpContext = async ({ req }) => ({
  prisma,
  pubsub,
  req,
});

// Create the GraphQL schema
export const schema = createSchema({
  typeDefs,
  resolvers,
});
export const yoga = createYoga({
  schema,
  context: getHttpContext,
});
const server = createServer(yoga);
// Start the server and you're done!
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql');
});
