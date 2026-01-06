import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getBookingById);
router.post('/', authorize('ADMIN', 'MANAGER'), bookingController.createBooking);
router.put('/:id', authorize('ADMIN', 'MANAGER'), bookingController.updateBooking);
router.delete('/:id', authorize('ADMIN'), bookingController.deleteBooking);

export default router;
