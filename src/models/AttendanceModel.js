import db from '../config/db.js';

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
                 VALUES (?, ?, ?, ?, NOW(), ?)
                 ON DUPLICATE KEY UPDATE
                    datetime = VALUES(datetime),
                    disease_name = VALUES(disease_name),
                    disease_amount = VALUES(disease_amount)`,
                [patient_id, disease_name, newAmount, added_by, date]
            );

            // Update total_bill (difference)
            const diff = newAmount - oldAmount;
            if (diff !== 0) {
                await conn.execute(
                    `UPDATE patients SET total_bill = total_bill + ? WHERE id = ?`,
                    [diff, patient_id]
                );
            }

            // If new attendance record (not existed earlier), increase total_attendance
            if (!existing.length) {
                await conn.execute(
                    `UPDATE patients SET total_attendance = total_attendance + 1 WHERE id = ?`,
                    [patient_id]
                );
            }

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

            // Reduce total_bill if attendance existed
            if (oldAmount > 0) {
                await conn.execute(
                    `UPDATE patients SET total_bill = total_bill - ? WHERE id = ?`,
                    [oldAmount, patient_id]
                );
            }

            // Reduce total_attendance only if a record existed
            if (existing.length) {
                await conn.execute(
                    `UPDATE patients SET total_attendance = total_attendance - 1 WHERE id = ?`,
                    [patient_id]
                );
            }

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

const getAttendanceHistoryByPatientId = async (page = 1, limit = 10, search = "", patientId) => {
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

const getAllPatientsWithAttendance = async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
    date = null
) => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const params = [searchPattern, searchPattern];
    let whereClause = `(p.name LIKE ? OR p.phone LIKE ?)`;

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
            p.father_name,
            p.dob,
            p.gender,
            p.status,
            p.phone,
            p.address,
            p.enrollment_date,
            p.amount_paid,
            p.total_bill,
            p.created_at,
            p.updated_at,

            uc.name AS created_by,
            uu.name AS updated_by,

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
        LEFT JOIN users uc ON p.created_by = uc.id
        LEFT JOIN users uu ON p.updated_by = uu.id
        LEFT JOIN diseases d ON p.disease = d.id
        WHERE ${whereClause}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
        `,
        params
    );

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
    getAllPatientsWithAttendance,
    getAttendanceHistoryByPatientId,
};
