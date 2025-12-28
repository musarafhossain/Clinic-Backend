import db from '../config/db.js';
import { getCurrentDateTime, dateWithCurrentTime } from '../utils/time.js';

const toggleAttendance = async ({
    patient_id,
    disease_name,
    disease_amount,
    added_by,
    date,
    is_present
}) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        if (is_present) {
            // Check if attendance exists for this date
            const [existing] = await conn.execute(
                `SELECT disease_amount FROM attendances
                 WHERE patient_id = ? AND DATE(datetime) = ?`,
                [patient_id, date]
            );

            let oldAmount = existing.length ? Number(existing[0].disease_amount) : 0;
            let newAmount = Number(disease_amount);

            // Insert or update attendance
            const [result] = await conn.execute(
                `INSERT INTO attendances
                    (patient_id, disease_name, disease_amount, added_by, created_at, datetime)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    datetime = VALUES(datetime),
                    disease_name = VALUES(disease_name),
                    disease_amount = VALUES(disease_amount)`,
                [patient_id, disease_name, newAmount, added_by, getCurrentDateTime(), dateWithCurrentTime(date)]
            );

            // Update total_bill (difference)
            const diff = newAmount - oldAmount;

            await conn.commit();

            return {
                action: existing.length ? "updated" : "added",
                id: result.insertId,
                patient_id,
                bill_change: diff
            };

        } else {
            // Removing attendance -------------------------
            const [existing] = await conn.execute(
                `SELECT disease_amount FROM attendances
                 WHERE patient_id = ? AND DATE(datetime) = ?`,
                [patient_id, date]
            );

            let oldAmount = existing.length ? Number(existing[0].disease_amount) : 0;

            // Delete attendance record
            const [result] = await conn.execute(
                `DELETE FROM attendances
                 WHERE patient_id = ? AND DATE(datetime) = ?`,
                [patient_id, date]
            );

            await conn.commit();

            return {
                action: "deleted",
                affectedRows: result.affectedRows,
                patient_id,
                bill_change: -oldAmount
            };
        }
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const getAttendanceByPatientId = async (page = 1, limit = 10, search = "", patientId) => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const params = [searchPattern, searchPattern];
    let whereClause = `(datetime LIKE ? OR disease_name LIKE ?)`;

    if (patientId) {
        whereClause += ` AND patient_id = ?`;
        params.push(patientId);
    }

    params.push(limit, offset);

    const [rows] = await db.execute(
        `
        SELECT *
        FROM attendances
        WHERE ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        `,
        params
    );

    const countParams = [searchPattern, searchPattern];
    let countWhere = `(datetime LIKE ? OR disease_name LIKE ?)`;

    if (patientId) {
        countWhere += ` AND patient_id = ?`;
        countParams.push(patientId);
    }

    const [[{ total }]] = await db.execute(
        `
        SELECT COUNT(*) as total 
        FROM attendances 
        WHERE ${countWhere}
        `,
        countParams
    );

    return {
        items: rows,
        currentPage: page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
    };
};

const getAllAttendance = async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
    date = null
) => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const params = [];

    // Add date param for today_payment
    if (date) {
        params.push(date);
    }

    let whereClause = `(p.name LIKE ? OR p.phone LIKE ?)`;
    params.push(searchPattern, searchPattern);

    if (status) {
        whereClause += ` AND p.status = ?`;
        params.push(status);
    }

    params.push(limit, offset);

    const [rows] = await db.execute(
        `
        SELECT 
            p.id,
            p.name,
            p.guardian_name,

            (
                SELECT COALESCE(SUM(ph.amount), 0)
                FROM payment_history ph
                WHERE ph.patient_id = p.id
                ${date ? `AND DATE(ph.created_at) = DATE(?)` : ``}
            ) AS today_payment,

            IF(
                d.id IS NULL,
                NULL,
                JSON_OBJECT(
                    'id', d.id,
                    'name', d.name,
                    'amount', d.amount
                )
            ) AS disease
        FROM patients p
        LEFT JOIN diseases d ON p.disease = d.id
        WHERE ${whereClause}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
        `,
        params
    );

    // ------------------ Attendance ------------------
    let attendanceMap = {};
    if (date) {
        const [attRows] = await db.execute(
            `
            SELECT 
                patient_id,
                disease_name,
                disease_amount,
                datetime
            FROM attendances
            WHERE DATE(datetime) = DATE(?)
            `,
            [date]
        );

        attendanceMap = attRows.reduce((acc, a) => {
            acc[a.patient_id] = {
                is_present: true,
                disease: a.disease_name,
                amount: a.disease_amount,
                datetime: a.datetime
            };
            return acc;
        }, {});
    }

    const formattedRows = rows.map((p) => ({
        ...p,
        disease: p.disease ? JSON.parse(p.disease) : null,
        attendance: attendanceMap[p.id] || {
            is_present: false,
            disease: null,
            amount: null
        }
    }));

    // ------------------ Count ------------------
    const countParams = [searchPattern, searchPattern];
    let countWhere = `(name LIKE ? OR phone LIKE ?)`;

    if (status) {
        countWhere += ` AND status = ?`;
        countParams.push(status);
    }

    const [[{ total }]] = await db.execute(
        `
        SELECT COUNT(*) as total 
        FROM patients
        WHERE ${countWhere}
        `,
        countParams
    );

    return {
        items: formattedRows,
        currentPage: page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
    };
};

export default {
    toggleAttendance,
    getAllAttendance,
    getAttendanceByPatientId,
};
