import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', documentController.getAllDocuments);
router.get('/categories/stats', documentController.getDocumentsByCategory);
router.get('/:id', documentController.getDocumentById);
router.post('/upload', authorize('ADMIN', 'MANAGER'), documentController.uploadDocument);
router.put('/:id/fileStatus', authorize('ADMIN', 'MANAGER'), documentController.updateDocumentfileStatus);
router.delete('/:id', authorize('ADMIN'), documentController.deleteDocument);

export default router;
