import { Router } from 'express';
import * as guideController from '../controllers/guide.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', guideController.getAllGuides);
router.get('/:id', guideController.getGuideById);
router.post('/', authorize('ADMIN', 'MANAGER'), guideController.createGuide);
router.put('/:id', authorize('ADMIN', 'MANAGER'), guideController.updateGuide);
router.delete('/:id', authorize('ADMIN'), guideController.deleteGuide);

export default router;
