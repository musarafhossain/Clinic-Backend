import PatientModel from '../models/PatientModel.js';
import { getCurrentDateTime } from '../utils/time.js';

// Create patient controller
const createPatient = async (req, res, next) => {
    try {
        // Prepare patient data
        const patientData = {
            name: req.body.name ?? null,
            guardian_name: req.body.guardian_name ?? null,
            dob: req.body.dob ?? null,
            gender: req.body.gender ?? null,
            status: req.body.status ?? "ONGOING",
            disease: req.body.disease?.id ?? null,
            phone: req.body.phone ?? null,
            address: req.body.address ?? null,
            created_by: req.user?.id ?? null,
            updated_by: req.user?.id ?? null,
            created_at: getCurrentDateTime(),
            updated_at: getCurrentDateTime(),
        };

        // Validate patient data
        if (!patientData.name) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: name"
            });
        }

        // Create new patient
        const newPatient = await PatientModel.createPatient(patientData);

        // Return response
        return res.status(201).json({
            success: true,
            data: newPatient,
            message: "Patient created successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Get all patients controller
const getAllPatients = async (req, res, next) => {
    try {
        // Get query parameters
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const status = req.query.status || "";

        // Get all patients
        const {
            items,
            total,
            currentPage,
            lastPage
        } = await PatientModel.getAllPatients(page, limit, search, status);

        // Return response
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

// Get patient by id controller
const getPatientById = async (req, res, next) => {
    try {
        // Get patient id
        const patientId = req.params.id;

        // Get patient by id
        const patient = await PatientModel.getPatientById(patientId);

        // Check if patient exists
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Return response
        return res.status(200).json({
            success: true,
            data: patient,
            message: 'Patient retrieved successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Update patient by id controller
const updatePatientById = async (req, res, next) => {
    try {
        // Get patient id
        const patientId = req.params.id;

        // Check if patient id exists
        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: "Patient ID is required"
            });
        }

        // Get current patient
        const currPatient = await PatientModel.getPatientById(patientId);
        if (!currPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Prepare patient data
        let patientData = {
            name: req.body.name ?? currPatient.name ?? null,
            guardian_name: req.body.guardian_name ?? currPatient.guardian_name ?? null,
            dob: req.body.dob ?? currPatient.dob ?? null,
            gender: req.body.gender ?? currPatient.gender ?? null,
            status: req.body.status ?? currPatient.status ?? "ONGOING",
            disease: req.body.disease?.id ?? currPatient.disease ?? null,
            phone: req.body.phone ?? currPatient.phone ?? null,
            address: req.body.address ?? currPatient.address ?? null,
            updated_by: req.user?.id ?? currPatient.updated_by ?? null,
            updated_at: getCurrentDateTime(),
        };

        // Validate patient data
        if (!patientData.name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name"
            });
        }

        // Update patient
        const updatedPatient = await PatientModel.updatePatientById(patientId, patientData);

        // Return response
        return res.status(200).json({
            success: true,
            data: updatedPatient,
            message: 'Patient updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Delete patient by id controller
const deletePatientById = async (req, res, next) => {
    try {
        // Get patient id
        const patientId = req.params.id;

        // Get patient by id
        const patient = await PatientModel.getPatientById(patientId);

        // Check if patient exists
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Delete patient
        await PatientModel.deletePatientById(patientId);

        // Return response
        res.status(200).json({
            success: true,
            message: 'Patient deleted successfully',
            data: patient
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
};