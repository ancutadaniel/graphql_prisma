import jwt from 'jsonwebtoken';
import { handleErrorMessage } from './handleErrors.js';

const JWT_SECRET = Buffer.from(process.env.JWT_SECRET, 'base64');

const getUserId = (req, requireAuth = true) => {
  const authorizationHeader = req?.headers?.authorization || req?.Authorization;

  if (authorizationHeader) {
    const token = authorizationHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.sub;
    } catch (error) {
      handleErrorMessage(`Token invalid`, `TOKEN_INVALID`);
    }
  }

  if (requireAuth) {
    handleErrorMessage('Authentication required', 'AUTHENTICATION_REQUIRED');
  }

  return null;
};

export default getUserId;
