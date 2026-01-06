import { Router } from 'express';
import * as hotelController from '../controllers/hotel.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', hotelController.getAllHotels);
router.get('/:id', hotelController.getHotelById);
router.post('/', authorize('ADMIN', 'MANAGER'), hotelController.createHotel);
router.put('/:id', authorize('ADMIN', 'MANAGER'), hotelController.updateHotel);
router.delete('/:id', authorize('ADMIN'), hotelController.deleteHotel);

export default router;
