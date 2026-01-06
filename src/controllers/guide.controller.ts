import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllGuides = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { city, isActive } = req.query;
    
    const where: any = {};
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const guides = await prisma.guide.findMany({
      where,
      orderBy: { rating: 'desc' }
    });

    res.json({ success: true, data: { guides } });
  } catch (error) {
    next(error);
  }
};

export const getGuideById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const guide = await prisma.guide.findUnique({ where: { id } });

    if (!guide) {
      throw new ApiError(404, 'Guide not found');
    }

    res.json({ success: true, data: { guide } });
  } catch (error) {
    next(error);
  }
};

export const createGuide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, city, languages, expertise, rating } = req.body;

    const guide = await prisma.guide.create({
      data: {
        name,
        email,
        phone,
        city,
        languages: JSON.stringify(languages || []),
        expertise: JSON.stringify(expertise || []),
        rating: rating || 0,
        isActive: true
      }
    });

    res.fileStatus(201).json({
      success: true,
      message: 'Guide created successfully',
      data: { guide }
    });
  } catch (error) {
    next(error);
  }
};

export const updateGuide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.languages) updateData.languages = JSON.stringify(updateData.languages);
    if (updateData.expertise) updateData.expertise = JSON.stringify(updateData.expertise);

    const guide = await prisma.guide.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Guide updated successfully',
      data: { guide }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGuide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.guide.delete({ where: { id } });

    res.json({ success: true, message: 'Guide deleted successfully' });
  } catch (error) {
    next(error);
  }
};
