import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, tags } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        bookings: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 3, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { customers } });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { tickets: true, documents: true },
          orderBy: { createdAt: 'desc' }
        },
        notes: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    res.json({ success: true, data: { customer } });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, address, tags, preferences } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        tags: JSON.stringify(tags || []),
        preferences: JSON.stringify(preferences || {})
      }
    });

    res.fileStatus(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, tags, preferences } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(preferences && { preferences: JSON.stringify(preferences) })
      }
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({ where: { id } });

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
