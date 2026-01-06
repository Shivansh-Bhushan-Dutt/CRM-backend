import express from 'express';
import multer from 'multer';
import {
  importTourFiles,
  importHotels,
  importGuides,
  getTourFiles,
  getHotels,
  getGuides,
  getDashboardStats
} from '../controllers/import.controller';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Import routes
router.post('/tourfiles', upload.single('file'), importTourFiles);
router.post('/hotels', upload.single('file'), importHotels);
router.post('/guides', upload.single('file'), importGuides);

// Data fetching routes
router.get('/tourfiles', getTourFiles);
router.get('/hotels', getHotels);
router.get('/guides', getGuides);
router.get('/dashboard-stats', getDashboardStats);

export default router;
