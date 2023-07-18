import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const Query = {
  user: (parent, args, ctx, info) =>
    prisma.user.findUnique({
      where: {
        id: args.id,
      },
      include: {
        posts: true,
        comments: true,
      },
    }),
  users: (parent, args, ctx, info) =>
    prisma.user.findMany({
      include: {
        posts: true,
        comments: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  post: (parent, args, ctx, info) =>
    prisma.post.findUnique({
      where: {
        id: args.id,
      },
      include: {
        author: true,
        comments: true,
      },
    }),
  posts: (parent, args, ctx, info) =>
    prisma.post.findMany({
      include: {
        author: true,
        comments: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  comment: (parent, args, ctx, info) =>
    prisma.comment.findUnique({
      where: {
        id: args.id,
      },
      include: {
        author: true,
        post: true,
      },
    }),
  comments: (parent, args, ctx, info) =>
    prisma.comment.findMany({
      include: {
        author: true,
        post: true,
      },
    }),
};

export default Query;
