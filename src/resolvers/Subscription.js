import { handleErrorMessage } from '../../utils.js';

const Subscription = {
  comment: {
    subscribe: (parent, { postId }, { db, pubsub }, info) => {
      const post = db.posts.find(
        (post) => post.id === postId && post.published
      );
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
