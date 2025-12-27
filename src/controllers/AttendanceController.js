import AttendanceModel from '../models/AttendanceModel.js';

const markAttendance = async (req, res, next) => {
    try {
        const { patient_id, disease_name, disease_amount, date, is_present } = req.body;
        const added_by = req.user?.id ?? null;

        if (!patient_id) {
            return res.status(400).json({ success: false, message: "patient_id is required" });
        }
        if (!date) {
            return res.status(400).json({ success: false, message: "date is required" });
        }

        const formattedDate = `${date} 00:00:00`;

        const result = await AttendanceModel.toggleAttendance({
            patient_id,
            disease_name,
            disease_amount,
            added_by,
            date: formattedDate,
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

const getAllAttendance = async (req, res, next) => {
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
        } = await AttendanceModel.getAllAttendance(page, limit, search, status, date);

        return res.status(200).json({
            success: true,
            message: "Attendance retrieved successfully",
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
        const patientId = req.params.patientId || "";

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
    markAttendance,
    getAllAttendance,
    getAttendanceByPatientId
};
