import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to safely parse dates
const parseDate = (dateString: any): Date => {
  if (!dateString) return new Date();
  
  // If it's already a Date object
  if (dateString instanceof Date) return dateString;
  
  // If it's an Excel serial number
  if (typeof dateString === 'number') {
    return new Date((dateString - 25569) * 86400 * 1000);
  }
  
  // Try to parse as string
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

// Import Tour Files from Excel
export const importTourFiles = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const tourFiles = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      try {
        // Find the manager by email or name (support both old and new field names)
        let manager = await prisma.user.findFirst({
          where: {
            OR: [
              { email: (row.ManagerEmail || row.agentEmail)?.toLowerCase() },
              { name: row.ManagerName || row.agentName }
            ]
          }
        });

        // If not found, try matching by email prefix (e.g., "ketan" from "ketan@travelcrm.com")
        if (!manager && (row.ManagerEmail || row.agentEmail)) {
          const emailPrefix = (row.ManagerEmail || row.agentEmail).split('@')[0];
          manager = await prisma.user.findFirst({
            where: {
              email: {
                startsWith: emailPrefix
              }
            }
          });
        }

        if (!manager) {
          errors.push({ row: i + 2, error: `Manager not found: ${row.ManagerEmail || row.agentEmail || row.ManagerName || row.agentName}` });
          continue;
        }

        const startDate = parseDate(row.startDate);
        const endDate = parseDate(row.endDate);

        // Parse arrays from comma-separated strings
        const cities = row.cities ? String(row.cities).split(',').map((c: string) => c.trim()) : [];
        const hotels = row.hotels ? String(row.hotels).split(',').map((h: string) => h.trim()) : [];
        const guides = row.guides ? String(row.guides).split(',').map((g: string) => g.trim()) : [];

        const fileCode = row.fileCode || `TF${Date.now()}${i}`;

        // Upsert tour file (update if exists, create if not)
        const tourFile = await prisma.tourFile.upsert({
          where: { fileCode: fileCode },
          update: {
            tourName: String(row.tourName || ''),
            clientName: '',
            clientCountry: String(row.clientCountry || 'India'),
            pax: parseInt(String(row.pax || 0)),
            startDate: startDate,
            endDate: endDate,
            status: String(row.fileStatus || row.status || 'UPCOMING').toUpperCase().replace(/-/g, '_'),
            invoiceStatus: String(row.invoiceStatus || 'YET_TO_RAISE').toUpperCase().replace(/ /g, '_').replace(/-/g, '_'),
            pnr: String(row.pnr || ''),
            revenue: parseFloat(String(row.revenue || 0)),
            roomNights: parseInt(String(row.roomNights || 0)),
            managerId: manager.id,
            year: startDate.getFullYear(),
            month: startDate.getMonth() + 1,
            cities: JSON.stringify(cities),
            hotels: JSON.stringify(hotels),
            guides: JSON.stringify(guides),
            guide: String(row.guide || ''),
            transportType: String(row.transportType || 'Car'),
            agentName: manager.name,
            foreignTourOperator: String(row.foreignTourOperator || '')
          },
          create: {
            fileCode: fileCode,
            tourName: String(row.tourName || ''),
            clientName: '',
            clientCountry: String(row.clientCountry || 'India'),
            pax: parseInt(String(row.pax || 0)),
            startDate: startDate,
            endDate: endDate,
            status: String(row.fileStatus || row.status || 'UPCOMING').toUpperCase().replace(/-/g, '_'),
            invoiceStatus: String(row.invoiceStatus || 'YET_TO_RAISE').toUpperCase().replace(/ /g, '_').replace(/-/g, '_'),
            pnr: String(row.pnr || ''),
            revenue: parseFloat(String(row.revenue || 0)),
            roomNights: parseInt(String(row.roomNights || 0)),
            managerId: manager.id,
            year: startDate.getFullYear(),
            month: startDate.getMonth() + 1,
            cities: JSON.stringify(cities),
            hotels: JSON.stringify(hotels),
            guides: JSON.stringify(guides),
            guide: String(row.guide || ''),
            transportType: String(row.transportType || 'Car'),
            agentName: manager.name,
            foreignTourOperator: String(row.foreignTourOperator || '')
          }
        });

        tourFiles.push(tourFile);
      } catch (error: any) {
        errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Imported ${tourFiles.length} tour files`,
      imported: tourFiles.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Import Hotels from Excel
export const importHotels = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const hotels = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      try {
        // Check if hotel already exists
        const existing = await prisma.hotel.findFirst({
          where: {
            name: String(row.name),
            city: String(row.city)
          }
        });

        if (existing) {
          // Update existing hotel
          const updated = await prisma.hotel.update({
            where: { id: existing.id },
            data: {
              state: String(row.state || existing.state || ''),
              rating: parseFloat(String(row.rating || existing.rating || 0)),
              address: String(row.address || existing.address || ''),
              phone: String(row.phone || existing.phone || ''),
              email: row.email ? String(row.email) : existing.email,
              starRating: parseInt(String(row.starRating || existing.starRating || 3)),
            }
          });
          hotels.push(updated);
        } else {
          // Create new hotel
          const hotel = await prisma.hotel.create({
            data: {
              name: String(row.name),
              city: String(row.city),
              state: String(row.state || ''),
              rating: parseFloat(String(row.rating || 0)),
              address: String(row.address || ''),
              phone: String(row.phone || ''),
              email: row.email ? String(row.email) : null,
              starRating: parseInt(String(row.starRating || 3)),
            }
          });
          hotels.push(hotel);
        }
      } catch (error: any) {
        errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${hotels.length} hotels`,
      imported: hotels.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Import Guides from Excel
export const importGuides = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const guides = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      try {
        // Check if guide already exists
        const existing = await prisma.guide.findFirst({
          where: {
            name: String(row.name),
            phone: String(row.phone)
          }
        });

        const expertiseArray = row.expertise ? 
          String(row.expertise).split(',').map((e: string) => e.trim()) : 
          [];
        
        const languagesArray = row.languages ? 
          String(row.languages).split(',').map((l: string) => l.trim()) : 
          [];

        if (existing) {
          // Update existing guide
          const updated = await prisma.guide.update({
            where: { id: existing.id },
            data: {
              city: String(row.city || existing.city || ''),
              email: row.email ? String(row.email) : existing.email,
              languages: JSON.stringify(languagesArray.length > 0 ? languagesArray : JSON.parse(existing.languages)),
              expertise: JSON.stringify(expertiseArray.length > 0 ? expertiseArray : JSON.parse(existing.expertise)),
              rating: parseFloat(String(row.rating || existing.rating || 0)),
            }
          });
          guides.push(updated);
        } else {
          // Create new guide
          const guide = await prisma.guide.create({
            data: {
              name: String(row.name),
              phone: String(row.phone),
              city: String(row.city || ''),
              email: row.email ? String(row.email) : null,
              languages: JSON.stringify(languagesArray),
              expertise: JSON.stringify(expertiseArray),
              rating: parseFloat(String(row.rating || 0)),
            }
          });
          guides.push(guide);
        }
      } catch (error: any) {
        errors.push({ row: i + 2, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${guides.length} guides`,
      imported: guides.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all tour files with filters
export const getTourFiles = async (req: Request, res: Response) => {
  try {
    const { year, month, managerId } = req.query;

    const where: any = {};
    
    if (year) where.year = parseInt(year as string);
    if (month) where.month = parseInt(month as string);
    if (managerId) where.managerId = parseInt(managerId as string);

    const tourFiles = await prisma.tourFile.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    res.json(tourFiles);
  } catch (error: any) {
    console.error('Get tour files error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all hotels
export const getHotels = async (req: Request, res: Response) => {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json(hotels);
  } catch (error: any) {
    console.error('Get hotels error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all guides
export const getGuides = async (req: Request, res: Response) => {
  try {
    const guides = await prisma.guide.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json(guides);
  } catch (error: any) {
    console.error('Get guides error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { year, month, managerId } = req.query;

    const where: any = {};
    
    if (year && year !== 'all') where.year = parseInt(year as string);
    if (month && month !== 'all') where.month = parseInt(month as string);
    if (managerId) where.managerId = managerId as string;

    const tourFiles = await prisma.tourFile.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Parse JSON fields and convert to proper format
    const parsedTourFiles = tourFiles.map(tour => {
      const cities = typeof tour.cities === 'string' ? JSON.parse(tour.cities) : tour.cities;
      const hotels = typeof tour.hotels === 'string' ? JSON.parse(tour.hotels) : tour.hotels;
      const guides = typeof tour.guides === 'string' ? JSON.parse(tour.guides) : tour.guides;
      
      return {
        ...tour,
        cities: Array.isArray(cities) ? cities : [],
        hotels: Array.isArray(hotels) ? hotels : [],
        guides: Array.isArray(guides) ? guides : [],
      };
    });

    // Calculate statistics
    const totalPax = parsedTourFiles.reduce((sum, tour) => sum + tour.pax, 0);
    const totalRevenue = parsedTourFiles.reduce((sum, tour) => sum + tour.revenue, 0);
    const totalRoomNights = parsedTourFiles.reduce((sum, tour) => sum + tour.roomNights, 0);
    const totalFiles = parsedTourFiles.length;

    // Guide statistics
    const guideStats: { [key: string]: { name: string, files: number, pax: number, revenue: number } } = {};
    parsedTourFiles.forEach(tour => {
      if (tour.guide) {
        if (!guideStats[tour.guide]) {
          guideStats[tour.guide] = { name: tour.guide, files: 0, pax: 0, revenue: 0 };
        }
        guideStats[tour.guide].files++;
        guideStats[tour.guide].pax += tour.pax;
        guideStats[tour.guide].revenue += tour.revenue;
      }
    });

    // Hotel statistics
    const hotelStats: { [key: string]: { name: string, bookings: number, roomNights: number } } = {};
    parsedTourFiles.forEach(tour => {
      if (tour.hotels && Array.isArray(tour.hotels)) {
        tour.hotels.forEach((hotel: string) => {
          if (!hotelStats[hotel]) {
            hotelStats[hotel] = { name: hotel, bookings: 0, roomNights: 0 };
          }
          hotelStats[hotel].bookings++;
          hotelStats[hotel].roomNights += Math.floor(tour.roomNights / tour.hotels.length);
        });
      }
    });

    res.json({
      kpis: {
        totalPax,
        totalRevenue,
        totalRoomNights,
        totalFiles
      },
      guideStats: Object.values(guideStats).sort((a, b) => b.files - a.files),
      hotelStats: Object.values(hotelStats).sort((a, b) => b.bookings - a.bookings),
      tourFiles: parsedTourFiles
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
};
