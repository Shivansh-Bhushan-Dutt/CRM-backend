import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllHotels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { city, minRating, isActive } = req.query;
    
    const where: any = {};
    if (city) where.city = city;
    if (minRating) where.starRating = { gte: Number(minRating) };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const hotels = await prisma.hotel.findMany({
      where,
      orderBy: { starRating: 'desc' }
    });

    res.json({ success: true, data: { hotels } });
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      throw new ApiError(404, 'Hotel not found');
    }

    res.json({ success: true, data: { hotel } });
  } catch (error) {
    next(error);
  }
};

export const createHotel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, city, address, email, phone, starRating, amenities } = req.body;

    const hotel = await prisma.hotel.create({
      data: {
        name,
        city,
        address,
        email,
        phone,
        starRating: starRating || 0,
        amenities: JSON.stringify(amenities || []),
        isActive: true
      }
    });

    res.fileStatus(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: { hotel }
    });
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.amenities) updateData.amenities = JSON.stringify(updateData.amenities);

    const hotel = await prisma.hotel.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      data: { hotel }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHotel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.hotel.delete({ where: { id } });

    res.json({ success: true, message: 'Hotel deleted successfully' });
  } catch (error) {
    next(error);
  }
};
