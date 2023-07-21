import getUserId from '../utils/getUserId.js';
import { handleErrorMessage } from '../utils/handleErrors.js';

const Query = {
  me: async (parent, args, ctx, info) => {
    const userId = getUserId(ctx.req);

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        posts: true,
        comments: true,
      },
    });

    if (!user) {
      handleErrorMessage('User not found', 'USER_NOT_FOUND');
    }

    return user;
  },
  user: async (parent, args, ctx, info) => {
    const userId = getUserId(ctx.req);

    return await ctx.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        posts: true,
        comments: true,
      },
    });
  },
  users: (parent, args, ctx, info) => {
    if (args.query) {
      return ctx.prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: args.query,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          posts: true,
          comments: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    return ctx.prisma.user.findMany({
      include: {
        posts: true,
        comments: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  },
  post: async (parent, args, ctx, info) => {
    // is user authenticated?
    const userId = getUserId(ctx.req, false);

    // build the query
    let where = {
      id: args.id,
      OR: [
        {
          published: true,
        },
      ],
    };

    // if user is authenticated, add the authorId to the query
    if (userId) {
      where.OR.push({
        authorId: userId,
      });
    }

    // if user is authenticated, check if the post belongs to the user
    //  or if the post is published
    const posts = await ctx.prisma.post.findMany({
      where,
      include: {
        author: true,
        comments: true,
      },
    });

    if (posts.length === 0) {
      handleErrorMessage('Post not found', 'POST_NOT_FOUND');
    }

    return posts[0];
  },
  posts: async (parent, args, ctx, info) => {
    let where = {
      published: true,
    };

    if (args.query) {
      where.OR = [
        {
          title: {
            contains: args.query,
            mode: 'insensitive',
          },
        },
        {
          body: {
            contains: args.query,
            mode: 'insensitive',
          },
        },
      ];
    }

    return await ctx.prisma.post.findMany({
      where,
      include: {
        author: true,
        comments: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  },
  comment: async (parent, args, ctx, info) =>
    await ctx.prisma.comment.findUnique({
      where: {
        id: args.id,
      },
      include: {
        author: true,
        post: true,
      },
    }),
  comments: async (parent, args, ctx, info) => {
    const searchWhere = args.query
      ? {
          text: {
            contains: args.query,
            mode: 'insensitive',
          },
        }
      : {};

    return await ctx.prisma.comment.findMany({
      where: searchWhere,
      include: {
        author: true,
        post: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  },
  myPosts: async (parent, args, ctx, info) => {
    const userId = getUserId(ctx.req);

    if (!userId) {
      handleErrorMessage('Authentication required', 'AUTHENTICATION_REQUIRED');
    }

    const baseWhere = {
      authorId: userId,
    };

    const searchWhere = args.query
      ? {
          OR: [
            {
              title: {
                contains: args.query,
                mode: 'insensitive',
              },
            },
            {
              body: {
                contains: args.query,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const posts = await ctx.prisma.post.findMany({
      where: {
        ...baseWhere,
        ...searchWhere,
      },
      include: {
        author: true,
        comments: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (posts.length === 0) {
      handleErrorMessage('No posts found', 'NO_POSTS_FOUND');
    }

    return posts;
  },
};

export default Query;
