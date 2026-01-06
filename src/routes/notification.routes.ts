import { Router } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest  } from '../middleware/auth';
import { Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { priority } = req.query;
    const where: any = {};
    
    if (priority) where.priority = priority;

    const notes = await prisma.note.findMany({
      where,
      include: {
        booking: { select: { bookingNumber: true } },
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ success: true, data: { notes } });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, priority, bookingId, customerId } = req.body;

    const note = await prisma.note.create({
      data: {
        content,
        priority: priority || 'MEDIUM',
        bookingId,
        customerId
      }
    });

    res.status(201).json({ success: true, message: 'Note created', data: { note } });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content, priority } = req.body;

    const note = await prisma.note.update({
      where: { id },
      data: { content, priority }
    });

    res.json({ success: true, message: 'Note updated', data: { note } });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
