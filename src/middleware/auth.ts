import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // TODO: Implement session-based auth or JWT in future
  // For now, skip authentication to get the app working
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // TODO: Implement role-based authorization in future
    // For now, allow all requests
    next();
  };
};
