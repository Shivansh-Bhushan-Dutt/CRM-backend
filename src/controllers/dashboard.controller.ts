import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalBookings = await prisma.booking.count();
    const totalTickets = await prisma.ticket.count();
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });
    const totalCustomers = await prisma.customer.count();

    const totalRevenue = await prisma.booking.aggregate({
      _sum: { totalAmount: true }
    });

    const metrics = {
      totalBookings,
      totalTickets,
      pendingBookings,
      totalCustomers,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    };

    res.json({ success: true, data: { metrics } });
  } catch (error) {
    next(error);
  }
};

export const getChartData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const ticketsByType = await prisma.ticket.groupBy({
      by: ['ticketType'],
      _count: { ticketType: true }
    });

    const recentBookings = await prisma.booking.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, totalAmount: true }
    });

    const chartData = {
      bookingsByStatus: bookingsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      ticketsByType: ticketsByType.map(item => ({
        type: item.ticketType,
        count: item._count.ticketType
      })),
      weeklyRevenue: recentBookings.map(booking => ({
        date: booking.createdAt.toISOString().split('T')[0],
        amount: booking.totalAmount
      }))
    };

    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } }
    });

    const activities = recentBookings.map(booking => ({
      id: booking.id,
      type: 'booking',
      title: `New booking: ${booking.bookingNumber}`,
      customer: booking.customer.name,
      amount: booking.totalAmount,
      date: booking.createdAt
    }));

    res.json({ success: true, data: { activities } });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingTrips = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        travelDate: { gte: today, lte: nextMonth },
        status: { in: ['CONFIRMED', 'PENDING'] }
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } }
      },
      orderBy: { travelDate: 'asc' },
      take: 10
    });

    res.json({ success: true, data: { upcomingTrips: upcomingBookings } });
  } catch (error) {
    next(error);
  }
};
