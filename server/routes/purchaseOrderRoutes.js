
import { Router } from 'express';
import { listPOs, createPO, getPO, receivePartial, receiptPdf, receiptExcel } from '../controllers/purchaseOrderController.js';
const router=Router();
router.get('/', listPOs);
router.post('/', createPO);
router.get('/:id', getPO);
router.post('/:id/receive', receivePartial);
router.get('/:id/receipt.pdf', receiptPdf);
router.get('/:id/receipt.xlsx', receiptExcel);
export default router;
