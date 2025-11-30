import DiseaseModel from '../models/DiseaseModel.js';

const createDisease = async (req, res, next) => {
    try {
        const diseaseData = {
            name: req.body.name ?? null,
            amount: req.body.amount ?? null,
            created_by: req.user?.id ?? null,
            updated_by: req.user?.id ?? null,
        };

        if (!diseaseData.name || diseaseData.amount == null || diseaseData.amount === '') {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, amount"
            });
        }

        const existingDisease = await DiseaseModel.getDiseaseByName(diseaseData.name);

        if (existingDisease) {
            return res.status(409).json({
                success: false,
                message: "Disease with this name already exists"
            });
        }

        const newDisease = await DiseaseModel.createDisease(diseaseData);

        res.status(201).json({
            success: true,
            data: newDisease,
            message: 'Disease created successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getAllDiseases = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const { items, total, currentPage, lastPage } =
            await DiseaseModel.getAllDiseases(page, limit, search);

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

const getDiseaseById = async (req, res, next) => {
    try {
        const diseaseId = req.params.id;
        const disease = await DiseaseModel.getDiseaseById(diseaseId);

        if (!disease) {
            return res.status(404).json({
                success: false,
                message: 'Disease not found'
            });
        }

        res.status(200).json({
            success: true,
            data: disease,
            message: 'Disease retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

const updateDiseaseById = async (req, res, next) => {
    try {
        const diseaseId = req.params.id;

        if (!diseaseId) {
            return res.status(400).json({
                success: false,
                message: "Disease ID is required"
            });
        }

        const currDisease = await DiseaseModel.getDiseaseById(diseaseId);
        if (!currDisease) {
            return res.status(404).json({
                success: false,
                message: "Disease not found"
            });
        }

        let diseaseData = {
            ...currDisease,
            name: req.body.name ?? currDisease.name ?? null,
            amount: req.body.amount ?? currDisease.amount ?? null,
            updated_by: req.user?.id ?? null,
        };

        if (!diseaseData.name || diseaseData.amount == null || diseaseData.amount === '') {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, amount"
            });
        }

        const diseaseExist = await DiseaseModel.checkDiseaseExist(diseaseId, diseaseData.name);
        if (diseaseExist) {
            return res.status(409).json({
                success: false,
                message: "Disease with this name is already taken"
            });
        }

        const updatedDisease = await DiseaseModel.updateDiseaseById(diseaseId, diseaseData);

        return res.status(200).json({
            success: true,
            data: updatedDisease,
            message: 'Disease updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

const deleteDiseaseById = async (req, res, next) => {
    try {
        const diseaseId = req.params.id;
        const disease = await DiseaseModel.getDiseaseById(diseaseId);

        if (!disease) {
            return res.status(404).json({
                success: false,
                message: 'Disease not found'
            });
        }

        await DiseaseModel.deleteDiseaseById(diseaseId);

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