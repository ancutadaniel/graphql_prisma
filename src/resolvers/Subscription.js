import { handleErrorMessage } from '../utils/handleErrors.js';

const Subscription = {
  comment: {
    subscribe: (parent, { postId }, { prisma, pubsub }, info) => {
      const post = prisma.post.findUnique({
        where: {
          id: postId,
        },
      });
      if (!post) {
        handleErrorMessage('Post not found', 'POST_NOT_FOUND');
      }
      return pubsub.asyncIterator(`comment ${postId}`); // channel name comment 1
    },
  },
  post: {
    subscribe: (parent, args, { pubsub }, info) => pubsub.asyncIterator('post'),
  },
};

export default Subscription;
