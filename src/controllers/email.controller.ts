import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllEmails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isRead, isParsed, emailType } = req.query;
    
    const where: any = {};
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (isParsed !== undefined) where.isParsed = isParsed === 'true';
    if (emailType) where.emailType = emailType;

    const emails = await prisma.email.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: 100
    });

    res.json({ success: true, data: { emails } });
  } catch (error) {
    next(error);
  }
};

export const getEmailById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const email = await prisma.email.findUnique({ where: { id } });

    if (!email) {
      throw new ApiError(404, 'Email not found');
    }

    res.json({ success: true, data: { email } });
  } catch (error) {
    next(error);
  }
};

export const markEmailAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const email = await prisma.email.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Email marked as read',
      data: { email }
    });
  } catch (error) {
    next(error);
  }
};

export const markEmailAsParsed = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { confidence } = req.body;

    const email = await prisma.email.update({
      where: { id },
      data: {
        isParsed: true,
        confidence: confidence || 0
      }
    });

    res.json({
      success: true,
      message: 'Email marked as parsed',
      data: { email }
    });
  } catch (error) {
    next(error);
  }
};

export const getLowConfidenceEmails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const emails = await prisma.email.findMany({
      where: {
        isParsed: true,
        confidence: { lt: 70 }
      },
      orderBy: { confidence: 'asc' },
      take: 50
    });

    res.json({ success: true, data: { emails } });
  } catch (error) {
    next(error);
  }
};
