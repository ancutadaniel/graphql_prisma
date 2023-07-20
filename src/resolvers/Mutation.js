import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import getUserId from '../utils/getUserId.js';
import { handleErrorMessage } from '../utils/handleErrors.js';
import hashPassword from '../utils/hasPassword.js';

const Mutation = {
  login: async (parent, { data: { email, password } }, ctx, info) => {
    const user = await ctx.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      handleErrorMessage('Unable to login.', 'UNABLE_TO_LOGIN');
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  },
  createUser: async (parent, args, ctx, info) => {
    let user;

    const { data } = args;
    const emailExists = await ctx.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (emailExists) {
      handleErrorMessage('Email already exists', 'EMAIL_ALREADY_EXISTS');
      return null; // exit the function after handling the error
    }

    try {
      user = await ctx.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          age: data.age,
          password: await hashPassword(data.password),
        },
      });
    } catch (error) {
      handleErrorMessage(
        `User creation failed ${error.message}`,
        'USER_CREATION_FAILED'
      );
    }

    // Remove the password from the user object before returning it
    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: generateToken(user.id),
    };
  },
  updateUser: async (parent, args, ctx, info) => {
    const { data } = args;
    const userId = getUserId(ctx.req);

    try {
      const existingUser = await ctx.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!existingUser) {
        handleErrorMessage('User not found', 'USER_NOT_FOUND');
        return null;
      }

      // If the user is updating their password, hash it
      if (data.password && data.password !== existingUser?.password) {
        data.password = await hashPassword(data.password);
      }

      const updatedUser = await ctx.prisma.user.update({
        where: {
          id: userId,
        },
        data,
      });

      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        handleErrorMessage('User not found', 'USER_NOT_FOUND');
      } else {
        handleErrorMessage('User update failed', 'USER_UPDATE_FAILED');
      }
    }
  },
  deleteUser: async (parent, args, ctx, info) => {
    const userId = getUserId(ctx.req);

    const user = await ctx.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      handleErrorMessage('User not found', 'USER_NOT_FOUND');
      return null; // exit the function after handling the error
    }

    // Delete the user's associated posts and comments in parallel for efficiency
    await Promise.all([
      ctx.prisma.post.deleteMany({
        where: {
          authorId: userId,
        },
      }),
      ctx.prisma.comment.deleteMany({
        where: {
          authorId: userId,
        },
      }),
    ]);

    // Delete the user
    const deletedUser = ctx.prisma.user.delete({
      where: {
        id: userId,
      },
    });

    const { password, ...userWithoutPassword } = deletedUser;
    return userWithoutPassword;
  },
  createPost: async (parent, args, ctx, info) => {
    const { data } = args;
    const userId = getUserId(ctx.req);

    const post = await ctx.prisma.post.create({
      data: {
        title: data.title,
        body: data.body,
        published: data.published,
        author: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        author: true,
        comments: true,
      },
    });
    if (post.published) {
      ctx.pubsub.publish('post', {
        post: {
          mutation: 'CREATED',
          data: post,
        },
      });
    }
    return post;
  },
  updatePost: async (parent, args, ctx, info) => {
    const { id, data } = args;
    const userId = getUserId(ctx.req);

    // Check if the post exists and belongs to the user
    const existingPost = await ctx.prisma.post.findUnique({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!existingPost) {
      handleErrorMessage(
        'Post not found or you are not authorized to update it.',
        'POST_NOT_FOUND'
      );
    }

    let updatedPost;
    try {
      updatedPost = await ctx.prisma.post.update({
        where: {
          id,
          authorId: userId,
        },
        data: {
          ...data,
        },
        include: {
          author: true,
          comments: true,
        },
      });

      // Publish an update if the post is published
      if (updatedPost.published) {
        ctx.pubsub.publish(`post`, {
          post: {
            mutation: 'UPDATED',
            data: updatedPost,
          },
        });
      }

      return updatedPost;
    } catch (error) {
      handleErrorMessage(
        'Failed to update the post: ' + error.message,
        'POST_UPDATE_FAILED'
      );
    }
  },
  deletePost: async (parent, args, ctx, info) => {
    const { id } = args;
    const userId = getUserId(ctx.req);

    // Optional: Check if the post exists
    const post = await ctx.prisma.post.findUnique({
      where: { id, authorId: userId },
    });

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
    const deletedPost = await ctx.prisma.post.delete({
      where: {
        id: id,
        authorId: userId,
      },
    });
    ctx.pubsub.publish(`post`, {
      post: {
        mutation: 'DELETED',
        data: deletedPost,
      },
    });
    return deletedPost;
  },
  createComment: async (parent, { data }, ctx, info) => {
    const userId = getUserId(ctx.req);

    // Check if the post exists and is published
    const post = await ctx.prisma.post.findUnique({
      where: { id: data.postId },
      select: { published: true },
    });

    if (!post) {
      handleErrorMessage('Post not found.', 'POST_NOT_FOUND');
    }

    if (!post.published) {
      handleErrorMessage(
        'Cannot add comments to unpublished posts.',
        'POST_NOT_PUBLISHED'
      );
    }

    try {
      const comment = await ctx.prisma.comment.create({
        data: {
          text: data.text,
          author: {
            connect: {
              id: userId,
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

      ctx.pubsub.publish(`comment ${data.postId}`, {
        comment: {
          mutation: 'CREATED',
          data: comment,
        },
      });

      return comment;
    } catch (error) {
      handleErrorMessage(
        'Failed to create the comment: ' + error.message,
        'COMMENT_CREATION_FAILED'
      );
    }
  },
  updateComment: async (parent, { id, data }, ctx, info) => {
    const userId = getUserId(ctx.req);

    // Check if the comment exists and is authored by the current user
    const existingComment = await ctx.prisma.comment.findUnique({
      where: { id, authorId: userId },
    });

    if (!existingComment) {
      handleErrorMessage(
        'Comment not found or not authorized.',
        'COMMENT_NOT_FOUND_OR_UNAUTHORIZED'
      );
      return null; // Exit after error
    }

    try {
      const updatedComment = await ctx.prisma.comment.update({
        where: {
          id,
          authorId: userId,
        },
        data: {
          text: data.text,
        },
        include: {
          author: true,
          post: true,
        },
      });

      ctx.pubsub.publish(`comment ${updatedComment.post.id}`, {
        comment: {
          mutation: 'UPDATED',
          data: updatedComment,
        },
      });

      return updatedComment;
    } catch (error) {
      handleErrorMessage(
        'Failed to update the comment: ' + error.message,
        'COMMENT_UPDATE_FAILED'
      );
      return null;
    }
  },
  deleteComment: async (parent, { id }, ctx, info) => {
    const userId = getUserId(ctx.req);

    // Check if the comment exists and is authored by the current user
    const existingComment = await ctx.prisma.comment.findUnique({
      where: { id, authorId: userId },
    });

    if (!existingComment) {
      handleErrorMessage(
        'Comment not found or not authorized.',
        'COMMENT_NOT_FOUND_OR_UNAUTHORIZED'
      );
      return null; // Exit after error
    }

    try {
      const deletedComment = await ctx.prisma.comment.delete({
        where: {
          id,
          authorId: userId,
        },
      });

      ctx.pubsub.publish(`comment ${deletedComment.postId}`, {
        comment: {
          mutation: 'DELETED',
          data: deletedComment,
        },
      });

      return deletedComment;
    } catch (error) {
      handleErrorMessage(
        'Failed to delete the comment: ' + error.message,
        'COMMENT_DELETION_FAILED'
      );
      return null;
    }
  },
};

export default Mutation;
