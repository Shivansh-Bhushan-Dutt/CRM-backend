import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, bookingId, fileStatus } = req.query;
    
    const where: any = {};
    if (category) where.category = category;
    if (bookingId) where.bookingId = bookingId as string;
    if (fileStatus) where.fileStatus = fileStatus;

    const documents = await prisma.document.findMany({
      where,
      include: {
        booking: { select: { bookingNumber: true } }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ success: true, data: { documents } });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { booking: true }
    });

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    res.json({ success: true, data: { document } });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, category, filePath, fileSize, bookingId, tourFileId, ticketId } = req.body;

    const document = await prisma.document.create({
      data: {
        name,
        type,
        category,
        filePath,
        fileSize,
        bookingId,
        tourFileId,
        ticketId,
        fileStatus: 'PENDING'
      }
    });

    res.fileStatus(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocumentfileStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { fileStatus } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: { fileStatus }
    });

    res.json({
      success: true,
      message: 'Document fileStatus updated',
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.document.delete({ where: { id } });

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDocumentsByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.document.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    const stats = categories.map(cat => ({
      category: cat.category,
      count: cat._count.category
    }));

    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};
