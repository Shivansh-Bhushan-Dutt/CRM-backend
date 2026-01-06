import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileStatus, customerId } = req.query;
    
    const where: any = {};
    
    if (fileStatus) where.fileStatus = fileStatus;
    if (customerId) where.customerId = customerId as string;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        tickets: true,
        documents: true,
        tourFiles: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        tickets: true,
        documents: true,
        tourFiles: true,
        notes: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      bookingNumber,
      fileCode,
      customerId,
      customerName,
      destination,
      travelDate,
      returnDate,
      bookingType,
      totalAmount,
      paidAmount,
      status
    } = req.body;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        fileCode,
        customerId,
        customerName,
        destination,
        travelDate: new Date(travelDate),
        returnDate: returnDate ? new Date(returnDate) : null,
        bookingType,
        totalAmount,
        paidAmount: paidAmount || 0,
        status: status || 'CONFIRMED'
      },
      include: { customer: true }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.travelDate) updateData.travelDate = new Date(updateData.travelDate);
    if (updateData.returnDate) updateData.returnDate = new Date(updateData.returnDate);

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { customer: true, tickets: true }
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.booking.delete({ where: { id } });

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};
