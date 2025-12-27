import express from 'express';
import PaymentHistoryController from '../controllers/PaymentHistoryController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

// Create payment history
router.post('/:patientId', authMiddleware, PaymentHistoryController.addPaymentHistory);

// Get payment history by patient id
router.get('', authMiddleware, PaymentHistoryController.getPaymentHistory);

// Delete payment history by id
router.delete('/:id', authMiddleware, PaymentHistoryController.deletePaymentHistoryById); 

export default router;