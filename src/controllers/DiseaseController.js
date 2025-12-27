import DiseaseModel from '../models/DiseaseModel.js';
import { getCurrentDateTime } from '../utils/time.js';

// Create disease
const createDisease = async (req, res, next) => {
    try {
        // Prepare disease data
        const diseaseData = {
            name: req.body.name ?? null,
            amount: req.body.amount ?? null,
            created_by: req.user?.id ?? null,
            updated_by: req.user?.id ?? null,
            created_at: getCurrentDateTime(),
            updated_at: getCurrentDateTime(),
        };

        // Check if required fields are missing
        if (!diseaseData.name || diseaseData.amount == null || diseaseData.amount === ''){
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, amount"
            });
        }

        // Check if disease already exists
        const existingDisease = await DiseaseModel.getDiseaseByName(diseaseData.name);
        if (existingDisease) {
            return res.status(409).json({
                success: false,
                message: "Disease with this name already exists"
            });
        }

        // Create new disease
        const newDisease = await DiseaseModel.createDisease(diseaseData);

        // Return response
        res.status(201).json({
            success: true,
            data: newDisease,
            message: 'Disease created successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get all diseases
const getAllDiseases = async (req, res, next) => {
    try {
        // Get query parameters
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || null;
        const search = req.query.search || "";

        // Get all diseases
        const { items, total, currentPage, lastPage } =
            await DiseaseModel.getAllDiseases(page, limit, search);

        // Return response
        res.status(200).json({
            success: true,
            message: 'Diseases retrieved successfully',
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

// Get disease by id
const getDiseaseById = async (req, res, next) => {
    try {
        // Get disease id
        const diseaseId = req.params.id;

        // Get disease by id
        const disease = await DiseaseModel.getDiseaseById(diseaseId);

        // Return response if disease not found
        if (!disease) {
            return res.status(404).json({
                success: false,
                message: 'Disease not found'
            });
        }

        // Return response
        res.status(200).json({
            success: true,
            data: disease,
            message: 'Disease retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Update disease by id
const updateDiseaseById = async (req, res, next) => {
    try {
        // Get disease id
        const diseaseId = req.params.id;

        // Return response if disease id is not provided
        if (!diseaseId) {
            return res.status(400).json({
                success: false,
                message: "Disease ID is required"
            });
        }

        // Get current disease
        const currDisease = await DiseaseModel.getDiseaseById(diseaseId);

        // Return response if disease not found
        if (!currDisease) {
            return res.status(404).json({
                success: false,
                message: "Disease not found"
            });
        }

        // Prepare disease data
        let diseaseData = {
            ...currDisease,
            name: req.body.name ?? currDisease.name ?? null,
            amount: req.body.amount ?? currDisease.amount ?? null,
            updated_by: req.user?.id ?? null,
            updated_at: getCurrentDateTime(),
        };

        // Return response if required fields are missing
        if (!diseaseData.name || diseaseData.amount == null || diseaseData.amount === ''){
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, amount"
            });
        }

        // Check if disease name is already taken
        const diseaseExist = await DiseaseModel.checkDiseaseExist(diseaseId, diseaseData.name);
        if (diseaseExist) {
            return res.status(409).json({
                success: false,
                message: "Disease with this name is already taken"
            });
        }

        // Update disease
        const updatedDisease = await DiseaseModel.updateDiseaseById(diseaseId, diseaseData);

        // Return response
        return res.status(200).json({
            success: true,
            data: updatedDisease,
            message: 'Disease updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Delete disease by id
const deleteDiseaseById = async (req, res, next) => {
    try {
        // Get disease id
        const diseaseId = req.params.id;

        // Get disease by id
        const disease = await DiseaseModel.getDiseaseById(diseaseId);

        // Return response if disease not found
        if (!disease) {
            return res.status(404).json({
                success: false,
                message: 'Disease not found'
            });
        }

        // Delete disease
        await DiseaseModel.deleteDiseaseById(diseaseId);

        // Return response
        res.status(200).json({
            success: true,
            message: 'Disease deleted successfully',
            data: disease
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createDisease,
    getAllDiseases,
    getDiseaseById,
    updateDiseaseById,
    deleteDiseaseById
};