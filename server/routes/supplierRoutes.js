
import { Router } from 'express';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier, createPayment, listPayments, supplierStatement } from '../controllers/supplierController.js';
const router=Router();
router.get('/', listSuppliers);
router.post('/', createSupplier);
router.patch('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);
router.post('/:id/payments', createPayment);
router.get('/:id/payments', listPayments);
router.get('/:id/statement', supplierStatement);
export default router;
