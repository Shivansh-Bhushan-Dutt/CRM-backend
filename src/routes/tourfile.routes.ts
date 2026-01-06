import { Router } from 'express';
import * as tourfileController from '../controllers/tourfile.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', tourfileController.getAllTourFiles);
router.get('/:id', tourfileController.getTourFileById);
router.post('/', authorize('ADMIN', 'MANAGER'), tourfileController.createTourFile);
router.put('/:id', authorize('ADMIN', 'MANAGER'), tourfileController.updateTourFile);
router.delete('/:id', authorize('ADMIN'), tourfileController.deleteTourFile);

export default router;
