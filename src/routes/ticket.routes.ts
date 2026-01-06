import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', authorize('ADMIN', 'MANAGER'), ticketController.createTicket);
router.put('/:id', authorize('ADMIN', 'MANAGER'), ticketController.updateTicket);
router.delete('/:id', authorize('ADMIN'), ticketController.deleteTicket);
router.post('/parse', authorize('ADMIN', 'MANAGER'), ticketController.parseTicketFromEmail);

export default router;
