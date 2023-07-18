const Query = {
  user: (parent, args, ctx, info) =>
    ctx.prisma.user.findUnique({
      where: {
        id: args.id,
      },
      include: {
        posts: true,
        comments: true,
      },
    }),
  users: (parent, args, ctx, info) =>
    ctx.prisma.user.findMany({
      include: {
        posts: true,
        comments: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  post: (parent, args, ctx, info) =>
    ctx.prisma.post.findUnique({
      where: {
        id: args.id,
      },
      include: {
        author: true,
        comments: true,
      },
    }),
  posts: (parent, args, ctx, info) =>
    ctx.prisma.post.findMany({
      include: {
        author: true,
        comments: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  comment: (parent, args, ctx, info) =>
    ctx.prisma.comment.findUnique({
      where: {
        id: args.id,
      },
      include: {
        author: true,
        post: true,
      },
    }),
  comments: (parent, args, ctx, info) =>
    ctx.prisma.comment.findMany({
      include: {
        author: true,
        post: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
};

export default Query;
