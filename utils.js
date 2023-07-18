import { GraphQLError } from 'graphql';

export const handleErrorMessage = (message, code) => {
  throw new GraphQLError(message, {
    extensions: { code },
  });
};

export const notAuthorizedError = (message) => {
  throw new GraphQLError(message, {
    extensions: { code: 'NOT_AUTHORIZED' },
  });
};
