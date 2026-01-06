import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId, ticketType, fileStatus } = req.query;
    
    const where: any = {};
    if (bookingId) where.bookingId = bookingId as string;
    if (ticketType) where.ticketType = ticketType;
    if (fileStatus) where.fileStatus = fileStatus;

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        booking: {
          include: { customer: { select: { name: true, email: true } } }
        }
      },
      orderBy: { departureDate: 'desc' }
    });

    res.json({ success: true, data: { tickets } });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        booking: { include: { customer: true } },
        documents: true
      }
    });

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    res.json({ success: true, data: { ticket } });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      ticketNumber,
      bookingId,
      ticketType,
      pnr,
      provider,
      passengerName,
      origin,
      destination,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      ticketClass,
      fare,
      status
    } = req.body;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        bookingId,
        ticketType,
        pnr,
        provider,
        passengerName,
        origin,
        destination,
        departureDate: new Date(departureDate),
        departureTime,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        arrivalTime,
        class: ticketClass,
        fare,
        status: status || 'CONFIRMED'
      },
      include: { booking: true }
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.departureDate) updateData.departureDate = new Date(updateData.departureDate);
    if (updateData.arrivalDate) updateData.arrivalDate = new Date(updateData.arrivalDate);

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { booking: true }
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.ticket.delete({ where: { id } });

    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const parseTicketFromEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { emailId } = req.body;

    // Placeholder for future AI parsing implementation
    res.json({
      success: true,
      message: 'Ticket parsing initiated',
      data: { emailId, fileStatus: 'pending' }
    });
  } catch (error) {
    next(error);
  }
};
