import db from '../config/db.js';

const bulkMarkAttendance = async ({ date, added_by, records }) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const presentRecords = records.filter(r => r.is_present);


        if (presentRecords.length > 0) {
            const values = presentRecords.map(r => [
                r.patient_id,
                r.disease || null,
                r.amount || null,
                added_by,
                date
            ]);

            await connection.query(
                `
                INSERT INTO attendances
                    (patient_id, disease_name, disease_amount, added_by, datetime)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    datetime = VALUES(datetime),
                    disease_name = VALUES(disease_name),
                    disease_amount = VALUES(disease_amount)
                `,
                [values]
            );
        }

        const absentPatients = records
            .filter(r => !r.is_present)
            .map(r => r.patient_id);

        if (absentPatients.length > 0) {
            await connection.query(
                `
                DELETE FROM attendances
                WHERE DATE(datetime) = ?
                  AND patient_id IN (?)
                `,
                [date, absentPatients]
            );
        }

        await connection.commit();
        connection.release();

        return {
            success: true,
            message: "Bulk attendance updated",
            present: presentRecords.length,
            absent: absentPatients.length
        };

    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

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
            const [existing] = await conn.execute(
                `SELECT disease_amount FROM attendances
                 WHERE patient_id = ? AND DATE(datetime) = ?`,
                [patient_id, date]
            );

            let oldAmount = existing.length ? Number(existing[0].disease_amount) : 0;
            let newAmount = Number(disease_amount);

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

            const diff = newAmount - oldAmount;
            if (diff !== 0) {
                await conn.execute(
                    `UPDATE patients SET total_bill = total_bill + ? WHERE id = ?`,
                    [diff, patient_id]
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
            const [existing] = await conn.execute(
                `SELECT disease_amount FROM attendances
                 WHERE patient_id = ? AND DATE(datetime) = ?`,
                [patient_id, date]
            );

            let oldAmount = existing.length ? Number(existing[0].disease_amount) : 0;

            const [result] = await conn.execute(
                `DELETE FROM attendances
                 WHERE patient_id = ? AND DATE(datetime) = ?`,
                [patient_id, date]
            );

            if (oldAmount > 0) {
                await conn.execute(
                    `UPDATE patients SET total_bill = total_bill - ? WHERE id = ?`,
                    [oldAmount, patient_id]
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

const getAttendanceByDate = async (date) => {
    const [rows] = await db.execute(
        `
        SELECT 
            p.id AS patient_id,
            p.name AS patient_name,
            IF(pa.patient_id IS NULL, 0, 1) AS attendedToday,
            pa.disease_name,
            pa.disease_amount,
            pa.added_by,
            pa.datetime
        FROM patients p
        LEFT JOIN patient_attendance pa 
            ON p.id = pa.patient_id AND DATE(pa.datetime) = ?
        ORDER BY p.id ASC
        `,
        [date]
    );

    return rows;
};

const getAllPatients = async (
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
    getAttendanceByDate,
    getAllPatients,
    bulkMarkAttendance,
};
