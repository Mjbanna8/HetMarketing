import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../utils/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

interface JwtPayload {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  type: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'CUSTOMER' | 'ADMIN';
      };
    }
  }
}

export function generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: '15m',
  });
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: '30d',
  });
}

export function generateAdminAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: '8h',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}

export const authGuard = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (decoded.role !== 'CUSTOMER') {
      throw new UnauthorizedError('Invalid token for this resource');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired access token'));
    }
  }
};

export const adminGuard = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Admin access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (decoded.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required');
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!admin) {
      throw new UnauthorizedError('Admin not found');
    }

    req.user = { id: admin.id, email: admin.email, role: admin.role };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired admin token'));
    }
  }
};
