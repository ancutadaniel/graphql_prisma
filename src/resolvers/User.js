import getUserId from '../utils/getUserId.js';

const User = {
  email: (parent, args, { req }, info) => {
    const userId = getUserId(req, false);
    if (!userId) return null;

    // If the user is logged in and their ID matches the parent ID, return the email address. Else return null.
    return userId === parent.id ? parent.email : null;
  },
  posts: async (parent, args, { prisma, req }, info) => {
    const userId = getUserId(req, false);
    let whereClause = {
      authorId: parent.id,
      published: true,
    };

    if (userId === parent.id) {
      delete whereClause.published;
    }

    return await prisma.post.findMany({
      where: whereClause,
    });
  },
  password: () => null, // Always return null for password
};

export default User;
