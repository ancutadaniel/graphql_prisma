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
    // Default sorting
    let orderBy = { name: 'asc' };

    if (args.sortField && args.sortOrder) {
      orderBy = {
        [args.sortField]: args.sortOrder,
      };
    }

    const paginationArgs = {
      skip: args.after ? 1 : args.skip,
      take: args.take,
      include: {
        posts: true,
        comments: true,
      },
      orderBy: orderBy, // Use dynamic order based on arguments
      cursor: args.after
        ? {
            id: args.after,
          }
        : undefined,
    };

    const whereArgs = args.query
      ? {
          OR: [
            {
              name: {
                contains: args.query,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    return ctx.prisma.user.findMany({
      ...paginationArgs,
      where: whereArgs,
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
    console.log('args', args);
    const userId = getUserId(ctx.req, false);

    let where = {};

    if (!userId) {
      where.published = true;
    }

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

    // Default sorting
    let orderBy = { updatedAt: 'asc' };

    if (args.sortField && args.sortOrder) {
      orderBy = {
        [args.sortField]: args.sortOrder,
      };
    }

    const postArgs = {
      where,
      include: {
        author: true,
        comments: true,
      },
      orderBy: orderBy,
      skip: args.after ? 1 : args.skip,
      take: args.take,
      cursor: args.after
        ? {
            id: args.after,
          }
        : undefined,
    };

    return await ctx.prisma.post.findMany(postArgs);
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

    let orderBy = { updatedAt: 'desc' }; // default sorting

    if (args.sortField && args.sortOrder) {
      orderBy = {
        [args.sortField]: args.sortOrder,
      };
    }

    const commentArgs = {
      where: searchWhere,
      include: {
        author: true,
        post: true,
      },
      orderBy: orderBy,
      skip: args.after ? 1 : args.skip,
      take: args.take,
      cursor: args.after
        ? {
            id: args.after,
          }
        : undefined,
    };

    return await ctx.prisma.comment.findMany(commentArgs);
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

    let orderBy = { updatedAt: 'desc' }; // default sorting

    if (args.sortField && args.sortOrder) {
      orderBy = {
        [args.sortField]: args.sortOrder,
      };
    }

    const posts = await ctx.prisma.post.findMany({
      where: {
        ...baseWhere,
        ...searchWhere,
      },
      include: {
        author: true,
        comments: true,
      },
      orderBy: orderBy,
      skip: args.after ? 1 : args.skip,
      take: args.take,
      cursor: args.after
        ? {
            id: args.after,
          }
        : undefined,
    });

    if (posts.length === 0) {
      handleErrorMessage('No posts found', 'NO_POSTS_FOUND');
    }

    return posts;
  },
};

export default Query;
