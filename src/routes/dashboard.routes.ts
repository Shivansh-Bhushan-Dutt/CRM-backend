import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/metrics', dashboardController.getMetrics);
router.get('/charts', dashboardController.getChartData);
router.get('/activities', dashboardController.getRecentActivities);
router.get('/upcoming-trips', dashboardController.getUpcomingTrips);

export default router;
