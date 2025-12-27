import PaymentHistoryModel from '../models/PaymentHistoryModel.js';
import PatientModel from '../models/PatientModel.js';
import { getCurrentDateTime } from '../utils/time.js';

// Create payment history controller
const addPaymentHistory = async (req, res, next) => {
    try {
        // Get the patient id from the request params
        const patientId = req.params.patientId;

        // Check if the patient exists
        const patient = await PatientModel.getPatientById(patientId);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Prepare the payment history data
        const paymentHistoryData = {
            amount: req.body.amount,
            note: req.body.note,
            created_at: getCurrentDateTime(),
            created_by: req.user.id,
        };

        // Add the payment history
        const data = await PaymentHistoryModel.addPaymentHistory(patientId, paymentHistoryData);

        // Return response
        res.status(200).json({
            success: true,
            message: 'Payment added successfully',
            data: data
        });
    } catch (error) {
        next(error);
    }
};

// Get payment history by patient id or date controller
const getPaymentHistory = async (req, res, next) => {
    try {
        // Get query parameters
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search
            ? decodeURIComponent(req.query.search)
            : "";
        const patientId = req.query.patientId || "";
        const paymentDate = req.query.paymentDate || "";

        // Get payment history by patient id
        const {
            items,
            total,
            currentPage,
            lastPage
        } = await PaymentHistoryModel.getPaymentHistory(page, limit, search, patientId, paymentDate);

        // Return response
        return res.status(200).json({
            success: true,
            message: "Payment history retrieved successfully",
            data: {
                items,
                total,
                currentPage,
                lastPage,
            }
        });

    } catch (error) {
        next(error);
    }
};

// Delete payment history by id controller
const deletePaymentHistoryById = async (req, res, next) => {
    try {
        // Get the payment history id
        const id = req.params.id;

        // get the payment history by id
        const data = await PaymentHistoryModel.getPaymentHistoryById(id);

        // Check if the payment history was deleted
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Payment history not found',
            });
        }

        // Delete the payment history
        await PaymentHistoryModel.deletePaymentHistoryById(id);

        // Return response
        res.status(200).json({
            success: true,
            message: 'Payment history deleted successfully',
            data: data
        });
    } catch (error) {
        next(error);
    }
};

export default {
    addPaymentHistory,
    getPaymentHistory,
    deletePaymentHistoryById,
};