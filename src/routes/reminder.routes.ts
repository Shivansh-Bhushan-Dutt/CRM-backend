import { Router } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isCompleted, priority } = req.query;
    const where: any = {};
    
    if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';
    if (priority) where.priority = priority;

    const reminders = await prisma.reminder.findMany({
      where,
      include: { booking: { select: { bookingNumber: true } } },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ success: true, data: { reminders } });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, dueDate, priority, bookingId } = req.body;

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        bookingId,
        isCompleted: false
      }
    });

    res.fileStatus(201).json({ success: true, message: 'Reminder created', data: { reminder } });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, message: 'Reminder updated', data: { reminder } });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({ where: { id } });
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
