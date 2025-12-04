import PatientModel from '../models/PatientModel.js';

const createPatient = async (req, res, next) => {
    try {
        const patientData = {
            name: req.body.name ?? null,
            father_name: req.body.father_name ?? null,
            dob: req.body.dob ?? null,
            gender: req.body.gender ?? null,
            status: req.body.status ?? "ONGOING",
            disease: req.body.disease?.id ?? null,
            phone: req.body.phone ?? null,
            address: req.body.address ?? null,
            enrollment_date: req.body.enrollment_date ?? null,
            amount_paid: req.body.amount_paid ?? 0,
            total_bill: req.body.total_bill ?? 0,
            created_by: req.user?.id ?? null,
            updated_by: req.user?.id ?? null,
        };

        if (!patientData.name) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: name"
            });
        }

        const newPatient = await PatientModel.createPatient(patientData);

        return res.status(201).json({
            success: true,
            data: newPatient,
            message: "Patient created successfully"
        });

    } catch (error) {
        next(error);
    }
};

const getAllPatients = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const status = req.query.status || "";

        const {
            items,
            total,
            currentPage,
            lastPage
        } = await PatientModel.getAllPatients(page, limit, search, status);

        return res.status(200).json({
            success: true,
            message: "Patients retrieved successfully",
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

const getPatientById = async (req, res, next) => {
    try {
        const patientId = req.params.id;

        const patient = await PatientModel.getPatientById(patientId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: patient,
            message: 'Patient retrieved successfully'
        });

    } catch (error) {
        next(error);
    }
};

const updatePatientById = async (req, res, next) => {
    try {
        const patientId = req.params.id;

        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: "Patient ID is required"
            });
        }

        const currPatient = await PatientModel.getPatientById(patientId);
        if (!currPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        let patientData = {
            name: req.body.name ?? currPatient.name ?? null,
            father_name: req.body.father_name ?? currPatient.father_name ?? null,
            dob: req.body.dob ?? currPatient.dob ?? null,
            gender: req.body.gender ?? currPatient.gender ?? null,
            status: req.body.status ?? currPatient.status ?? "ONGOING",
            disease: req.body.disease?.id ?? currPatient.disease ?? null,
            phone: req.body.phone ?? currPatient.phone ?? null,
            address: req.body.address ?? currPatient.address ?? null,
            updated_by: req.user?.id ?? currPatient.updated_by ?? null,
        };

        if (!patientData.name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name"
            });
        }

        const updatedPatient = await PatientModel.updatePatientById(patientId, patientData);

        return res.status(200).json({
            success: true,
            data: updatedPatient,
            message: 'Patient updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

const deletePatientById = async (req, res, next) => {
    try {
        const patientId = req.params.id;

        const patient = await PatientModel.getPatientById(patientId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        await PatientModel.deletePatientById(patientId);

        res.status(200).json({
            success: true,
            message: 'Patient deleted successfully',
            data: patient
        });
    } catch (error) {
        next(error);
    }
};

const addPatientPayment = async (req, res, next) => {
    try {
        const patientId = req.params.id;
        const patient = await PatientModel.getPatientById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const txnData = {
            amount: req.body.amount ?? null,
            note: req.body.note ?? null,
            createdBy: req.user?.id ?? null,
        };

         if (!txnData.amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: amount"
            });
        }

        const data = await PatientModel.addPatientPayment(patientId, txnData);

        res.status(200).json({
            success: true,
            message: 'Payment added successfully',
            data: data
        });
    } catch (error) {
        next(error);
    }
};

const deletePaymentHistoryById = async (req, res, next) => {
    try {
        const id = req.params.id;

        const data = await PatientModel.deletePatientHistoryById(id);

        res.status(200).json({
            success: true,
            message: 'Payment history deleted successfully',
            data: data
        });
    } catch (error) {
        next(error);
    }
};

const getPaymentHistoryByPatientId = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search
            ? decodeURIComponent(req.query.search)
            : "";
        const patientId = req.query.patientId || "";

        const {
            items,
            total,
            currentPage,
            lastPage
        } = await PatientModel.getPaymentHistoryByPatientId(page, limit, search, patientId);

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

export default {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatientById,
    deletePatientById,
    addPatientPayment,
    getPaymentHistoryByPatientId,
    deletePaymentHistoryById,
};