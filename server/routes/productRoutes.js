
import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
const router=Router();
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', upload.single('image'), createProduct);
router.patch('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);
export default router;
