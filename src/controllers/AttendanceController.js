import AttendanceModel from '../models/AttendanceModel.js';

const markSingleAttendance = async (req, res, next) => {
    try {
        const { patient_id, disease_name, disease_amount, date, is_present } = req.body;
        const added_by = req.user?.id ?? null;

        if (!patient_id) {
            return res.status(400).json({ success: false, message: "patient_id is required" });
        }
        if (!date) {
            return res.status(400).json({ success: false, message: "date is required" });
        }

        const result = await AttendanceModel.toggleAttendance({
            patient_id,
            disease_name,
            disease_amount,
            added_by,
            date,
            is_present
        });

        return res.status(200).json({
            success: true,
            message: `Attendance ${result.action} successfully`,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


const bulkMarkAttendance = async (req, res, next) => {
    try {
        const { date, records } = req.body;
        const added_by = req.user?.id ?? null;

        if (!date) {
            return res.status(400).json({ success: false, message: "date is required" });
        }

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: "records array required" });
        }

        const result = await AttendanceModel.bulkMarkAttendance({
            date,
            added_by,
            records
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });

    } catch (error) {
        next(error);
    }
};


const getAttendanceByDate = async (req, res, next) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "date is required"
            });
        }

        const rows = await AttendanceModel.getAttendanceByDate(date);

        return res.status(200).json({
            success: true,
            message: 'Attendance fetched successfully',
            data: rows
        });

    } catch (error) {
        next(error);
    }
};


const getPatientsWithAttendance = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const status = req.query.status || "";
        const date = req.query.date || null;

        const {
            items,
            total,
            currentPage,
            lastPage
        } = await AttendanceModel.getAllPatients(page, limit, search, status, date);

        return res.status(200).json({
            success: true,
            message: "Patients attendance retrieved successfully",
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

const getAttendanceByPatientId = async (req, res, next) => {
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
        } = await AttendanceModel.getAttendanceByPatientId(page, limit, search, patientId);

        return res.status(200).json({
            success: true,
            message: "Patient attendances retrieved successfully",
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
    markSingleAttendance,
    bulkMarkAttendance,
    getAttendanceByDate,
    getPatientsWithAttendance,
    getAttendanceByPatientId
};
