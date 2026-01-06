import { Router } from 'express';
import * as emailController from '../controllers/email.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', emailController.getAllEmails);
router.get('/low-confidence', emailController.getLowConfidenceEmails);
router.get('/:id', emailController.getEmailById);
router.put('/:id/read', emailController.markEmailAsRead);
router.put('/:id/parse', authorize('ADMIN', 'MANAGER'), emailController.markEmailAsParsed);

export default router;
