import { createSchema, createYoga } from 'graphql-yoga';
import { PubSub } from 'graphql-subscriptions';
import { createServer } from 'node:http';
import fs from 'fs';
import db from './db.js';
import Query from './resolvers/Query.js';
import Mutation from './resolvers/Mutation.js';
import Subscription from './resolvers/Subscription.js';

export const pubsub = new PubSub();

// Read the schema from a file
const typeDefs = fs.readFileSync('./src/schema.graphql', 'utf8');
const resolvers = {
  Query,
  Mutation,
  Subscription,
};

// Create the GraphQL schema
export const schema = createSchema({
  typeDefs,
  resolvers,
});
export const yoga = createYoga({
  schema,
  context: {
    db,
    pubsub,
  },
});
const server = createServer(yoga);
// Start the server and you're done!
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql');
});