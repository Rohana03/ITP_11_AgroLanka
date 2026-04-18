
import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { createRequest, listRequests, approveRequest, rejectRequest } from '../controllers/productRequestController.js';
const router=Router();
router.get('/', listRequests);
router.post('/', upload.single('image'), createRequest);
router.patch('/:id/approve', approveRequest);
router.patch('/:id/reject', rejectRequest);
export default router;
