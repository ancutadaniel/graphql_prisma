import { handleErrorMessage } from '../../utils.js';

const Mutation = {
  createUser: async (parent, args, ctx, info) => {
    const { data } = args;
    try {
      return await ctx.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          age: data.age,
        },
      });
    } catch (error) {
      handleErrorMessage('Email already in use', 'EMAIL_IN_USE');
    }
  },
  updateUser: async (parent, args, ctx, info) => {
    const { id, data } = args;
    try {
      return await ctx.prisma.user.update({
        where: {
          id,
        },
        data: {
          email: data.email,
          name: data.name,
          age: data.age,
        },
      });
    } catch (error) {
      handleErrorMessage('User update failed', 'USER_UPDATE_FAILED');
    }
  },
  deleteUser: async (parent, args, ctx, info) => {
    const { id } = args;

    // Check if the ID is provided
    if (!id) {
      handleErrorMessage('Id not provided', 'ID_NOT_PROVIDED');
      return null; // exit the function after handling the error
    }

    // Check if the user exists
    const user = await ctx.prisma.user.findUnique({ where: { id } });
    if (!user) {
      handleErrorMessage('User not found', 'USER_NOT_FOUND');
      return null; // exit the function after handling the error
    }

    // Delete the user's associated posts
    await ctx.prisma.post.deleteMany({
      where: {
        authorId: id,
      },
    });

    // Delete the user's associated comments
    await ctx.prisma.comment.deleteMany({
      where: {
        authorId: id,
      },
    });

    // Delete the user
    return ctx.prisma.user.delete({
      where: {
        id,
      },
    });
  },
  createPost: async (parent, args, ctx, info) => {
    const { data } = args;
    return await ctx.prisma.post.create({
      data: {
        title: data.title,
        body: data.body,
        published: data.published,
        author: {
          connect: {
            id: data.authorId,
          },
        },
      },
      include: {
        author: true,
        comments: true,
      },
    });
  },
  updatePost: async (parent, args, ctx, info) => {
    const { id, data } = args;
    return await ctx.prisma.post.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        body: data.body,
        published: data.published,
      },
      include: {
        author: true,
        comments: true,
      },
    });
  },
  deletePost: async (parent, args, ctx, info) => {
    const { id } = args;

    // Optional: Check if the post exists
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) {
      handleErrorMessage('Post not found', 'POST_NOT_FOUND');
      return null; // exit the function after handling the error
    }

    // Delete the post's associated comments directly using postId
    await ctx.prisma.comment.deleteMany({
      where: {
        postId: id,
      },
    });

    // Delete the post
    return ctx.prisma.post.delete({
      where: {
        id,
      },
    });
  },
  createComment: async (parent, args, ctx, info) => {
    const { data } = args;
    return await ctx.prisma.comment.create({
      data: {
        text: data.text,
        author: {
          connect: {
            id: data.authorId,
          },
        },
        post: {
          connect: {
            id: data.postId,
          },
        },
      },
      include: {
        author: true,
        post: true,
      },
    });
  },
  updateComment: async (parent, args, ctx, info) => {
    const { id, data } = args;
    return await ctx.prisma.comment.update({
      where: {
        id,
      },
      data: {
        text: data.text,
      },
      include: {
        author: true,
        post: true,
      },
    });
  },
  deleteComment: async (parent, args, ctx, info) => {
    const { id } = args;
    return await ctx.prisma.comment.delete({
      where: {
        id,
      },
    });
  },
};

export default Mutation;
