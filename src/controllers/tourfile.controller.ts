import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllTourFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileStatus, city } = req.query;
    
    const where: any = {};
    if (fileStatus) where.fileStatus = fileStatus;

    const tourFiles = await prisma.tourFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({ success: true, data: tourFiles });
  } catch (error) {
    next(error);
  }
};

export const getTourFileById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    console.log('🔍 getTourFileById called with ID:', id);

    const tourFile = await prisma.tourFile.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        booking: true,
        documents: true
      }
    });

    console.log('📥 Tour file found:', !!tourFile);

    if (!tourFile) {
      console.error('❌ Tour file not found in database for ID:', id);
      throw new ApiError(404, 'Tour file not found');
    }

    res.json({ success: true, data: tourFile });
  } catch (error) {
    console.error('❌ Error in getTourFileById:', error);
    next(error);
  }
};

export const createTourFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Get managerId from request or find user by name
    let managerId = data.managerId;
    
    if (!managerId && data.manager?.name) {
      // Find user by name
      const user = await prisma.user.findFirst({
        where: { name: data.manager.name }
      });
      if (user) {
        managerId = user.id;
      }
    }
    
    if (!managerId && data.agentName) {
      // Fallback: find user by agent name
      const user = await prisma.user.findFirst({
        where: { name: data.agentName }
      });
      if (user) {
        managerId = user.id;
      }
    }
    
    // If still no managerId, use the first admin user as fallback
    if (!managerId) {
      const adminUser = await prisma.user.findFirst({
        where: { isAdmin: true }
      });
      if (adminUser) {
        managerId = adminUser.id;
      } else {
        throw new ApiError(400, 'No valid manager found. Please ensure users exist in the database.');
      }
    }

    // Parse dates
    const startDateObj = new Date(data.startDate || new Date());
    const year = startDateObj.getFullYear();
    const month = startDateObj.getMonth() + 1;

    // Prepare data for database
    const tourFileData: any = {
      fileCode: data.fileCode || `TF-${Date.now()}`,
      tourName: data.tourName || 'New Tour',
      clientName: data.clientName || null,
      clientCountry: data.clientCountry || null,
      startDate: startDateObj,
      endDate: data.endDate ? new Date(data.endDate) : startDateObj,
      pax: parseInt(data.pax) || 1,
      cities: typeof data.cities === 'string' ? data.cities : JSON.stringify(data.cities || []),
      hotels: typeof data.hotels === 'string' ? data.hotels : JSON.stringify(data.hotels || []),
      guides: typeof data.guides === 'string' ? data.guides : JSON.stringify(data.guides || []),
      guide: data.guide || data.tourLeader || null,
      agentName: data.agentName || null,
      foreignTourOperator: data.foreignTourOperator || null,
      transportType: data.transportType || data.transport || null,
      status: data.status || 'UPCOMING',
      invoiceStatus: data.invoiceStatus || 'YET_TO_RAISE',
      revenue: parseFloat(data.revenue) || 0,
      roomNights: parseInt(data.roomNights) || 0,
      pnr: data.pnr || null,
      year,
      month,
      
      // PDF Form fields
      bookingDate: data.bookingDate ? new Date(data.bookingDate) : null,
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      
      // Accommodation
      accomSingle: data.accomSingle || null,
      accomDouble: data.accomDouble || null,
      accomTwin: data.accomTwin || null,
      accomTriple: data.accomTriple || null,
      accomSuite: data.accomSuite || null,
      accomMeals: data.accomMeals || null,
      
      // Flight & Transport
      flight: data.flight || null,
      flightTime: data.flightTime || null,
      provider: data.provider || null,
      transport: data.transport || null,
      tourLeader: data.tourLeader || null,
      
      // Checklist items
      voucher: data.voucher || null,
      trainTickets: data.trainTickets || null,
      airTicket: data.airTicket || null,
      trainTkt: data.trainTkt || null,
      safaris: data.safaris || null,
      trainTicket120: data.trainTicket120 || null,
      specials: data.specials || null,
      
      // Itinerary
      itinerary: data.itinerary ? JSON.stringify(data.itinerary) : null,
      
      managerId: managerId
    };

    const tourFile = await prisma.tourFile.create({
      data: tourFileData,
      include: {
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tour file created successfully',
      data: tourFile
    });
  } catch (error) {
    console.error('Create tour file error:', error);
    next(error);
  }
};

export const updateTourFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Prepare update data
    const updateData: any = {};

    // Handle dates
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
      updateData.year = updateData.startDate.getFullYear();
      updateData.month = updateData.startDate.getMonth() + 1;
    }
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.bookingDate) updateData.bookingDate = new Date(data.bookingDate);
    if (data.arrivalDate) updateData.arrivalDate = new Date(data.arrivalDate);

    // Handle arrays
    if (data.cities) updateData.cities = typeof data.cities === 'string' ? data.cities : JSON.stringify(data.cities);
    if (data.hotels) updateData.hotels = typeof data.hotels === 'string' ? data.hotels : JSON.stringify(data.hotels);
    if (data.guides) updateData.guides = typeof data.guides === 'string' ? data.guides : JSON.stringify(data.guides);
    if (data.itinerary) updateData.itinerary = typeof data.itinerary === 'string' ? data.itinerary : JSON.stringify(data.itinerary);

    // Handle simple fields
    const simpleFields = [
      'fileCode', 'tourName', 'clientName', 'clientCountry', 'pax', 'guide', 'agentName',
      'foreignTourOperator', 'transportType', 'status', 'invoiceStatus', 'revenue', 
      'roomNights', 'pnr', 'accomSingle', 'accomDouble', 'accomTwin', 'accomTriple',
      'accomSuite', 'accomMeals', 'flight', 'flightTime', 'provider', 'transport',
      'tourLeader', 'voucher', 'trainTickets', 'airTicket', 'trainTkt', 'safaris',
      'trainTicket120', 'specials'
    ];

    simpleFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Convert numeric fields
    if (updateData.pax) updateData.pax = parseInt(updateData.pax);
    if (updateData.revenue) updateData.revenue = parseFloat(updateData.revenue);
    if (updateData.roomNights) updateData.roomNights = parseInt(updateData.roomNights);

    const tourFile = await prisma.tourFile.update({
      where: { id },
      data: updateData,
      include: {
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      success: true,
      message: 'Tour file updated successfully',
      data: tourFile
    });
  } catch (error) {
    console.error('Update tour file error:', error);
    next(error);
  }
};

export const deleteTourFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.tourFile.delete({ where: { id } });

    res.json({ success: true, message: 'Tour file deleted successfully' });
  } catch (error) {
    next(error);
  }
};
