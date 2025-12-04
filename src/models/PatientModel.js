import db from '../config/db.js';

const createPatient = async (patientData) => {
    const { name, father_name, dob, gender, status, disease, phone, address, enrollment_date, amount_paid = 0, total_bill = 0, created_by, updated_by, } = patientData;

    const [result] = await db.execute(
        `INSERT INTO patients 
        (name, father_name, dob, gender, status, disease, phone, address, enrollment_date, amount_paid, total_bill, created_at, created_by, updated_at, updated_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
        [name, father_name, dob, gender, status, disease, phone, address, enrollment_date, amount_paid, total_bill, created_by, updated_by]
    );

    return getPatientById(result.insertId) ?? null;
};

const getAllPatients = async (page = 1, limit = 10, search = "", status = "") => {
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
            p.total_attendance,
            p.created_at,
            p.updated_at,

            uc.name AS created_by,
            uu.name AS updated_by,

            -- Disease as JSON object
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

    const formattedRows = rows.map((p) => ({
        ...p,
        disease: p.disease ? JSON.parse(p.disease) : null,
    }));

    return {
        items: formattedRows,
        currentPage: page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
    };
};

const getPatientById = async (patientId) => {
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
            p.total_attendance,
            p.created_at,
            p.updated_at,

            -- Created by user name
            uc.name AS created_by,

            -- Updated by user name
            uu.name AS updated_by,

            -- Disease as JSON object
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
        WHERE p.id = ?
        LIMIT 1
        `,
        [patientId]
    );

    const patient = rows[0] || null;

    if (patient?.disease && typeof patient.disease === "string") {
        patient.disease = JSON.parse(patient.disease);
    }

    return patient;
};

const updatePatientById = async (patientId, patientData) => {
    const { name, father_name, dob, gender, status, disease, phone, address, updated_by } = patientData;

    await db.execute(
        `
        UPDATE patients 
        SET 
            name = ?,
            father_name = ?,
            dob = ?,
            gender = ?,
            status = ?,
            disease = ?,
            phone = ?,
            address = ?,
            updated_by = ?,
            updated_at = NOW()
        WHERE id = ?
        `,
        [name, father_name, dob, gender, status, disease, phone, address, updated_by, patientId]
    );

    return await getPatientById(patientId) ?? null;
};

const deletePatientById = async (patientId) => {
    await db.execute('DELETE FROM patients WHERE id = ?', [patientId]);
    return true;
};

const addPatientPayment = async (patientId, patientData) => {
    const { amount, note, createdBy } = patientData;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [txnResult] = await connection.execute(
            `
            INSERT INTO transactions (patient_id, amount, note, created_by)
            VALUES (?, ?, ?, ?)
            `,
            [patientId, amount, note ?? "", createdBy ?? 0]
        );
        const transactionId = txnResult.insertId;
        const [prevRows] = await connection.execute(
            `
            SELECT amount_paid 
            FROM patients 
            WHERE id = ?
            `,
            [patientId]
        );
        const previousAmount = prevRows?.[0]?.amount_paid ?? 0;
        const newAmountPaid = Number(previousAmount) + Number(amount);
        await connection.execute(
            `
            UPDATE patients
            SET amount_paid = ?
            WHERE id = ?
            `,
            [newAmountPaid, patientId]
        );
        const [transactionData] = await connection.execute(
            `
            SELECT * FROM transactions 
            WHERE id = ?
            `,
            [transactionId]
        );
        await connection.commit();
        return transactionData?.[0] ?? null;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const deletePatientHistoryById = async (transactionId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const [txnRows] = await connection.execute(
            `
            SELECT amount, patient_id 
            FROM transactions
            WHERE id = ?
            `,
            [transactionId]
        );

        if (txnRows.length === 0) {
            throw new Error("Transaction not found");
        }

        const txnAmount = Number(txnRows[0].amount);
        const patientId = txnRows[0].patient_id;
        await connection.execute(
            `
            DELETE FROM transactions
            WHERE id = ?
            `,
            [transactionId]
        );
        const [patientRows] = await connection.execute(
            `
            SELECT amount_paid
            FROM patients
            WHERE id = ?
            `,
            [patientId]
        );

        const previousAmountPaid = Number(patientRows[0]?.amount_paid ?? 0);
        const updatedAmount = previousAmountPaid - txnAmount;

        await connection.execute(
            `
            UPDATE patients
            SET amount_paid = ?
            WHERE id = ?
            `,
            [updatedAmount, patientId]
        );
        await connection.commit();

        return {
            deletedTransactionId: transactionId,
            deletedAmount: txnAmount,
            updatedAmountPaid: updatedAmount,
        };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const getPaymentHistoryByPatientId = async (page = 1, limit = 10, search = "", patientId) => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const params = [searchPattern, searchPattern];
    let whereClause = `(amount LIKE ? OR created_at LIKE ?)`;

    if (patientId) {
        whereClause += ` AND patient_id = ?`;
        params.push(patientId);
    }

    params.push(limit, offset);

    const [rows] = await db.execute(
        `
        SELECT *
        FROM transactions
        WHERE ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        `,
        params
    );

    const countParams = [searchPattern, searchPattern];
    let countWhere = `(amount LIKE ? OR created_at LIKE ?)`;

    if (patientId) {
        countWhere += ` AND patient_id = ?`;
        countParams.push(patientId);
    }

    const [[{ total }]] = await db.execute(
        `
        SELECT COUNT(*) as total 
        FROM transactions 
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

export default {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatientById,
    deletePatientById,
    addPatientPayment,
    getPaymentHistoryByPatientId,
    deletePatientHistoryById,
};