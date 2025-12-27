import db from '../config/db.js';

// Add payment history
/*
    @param {number} patientId
    @param {object} PaymentHistoryData
    @param {number} PaymentHistoryData.amount
    @param {string} PaymentHistoryData.note
    @param {string} PaymentHistoryData.created_at
    @param {number} PaymentHistoryData.created_by
    @returns {object}
*/
const addPaymentHistory = async (patientId, PaymentHistoryData) => {
    // Destructure the payment history data
    const { amount, note, created_at, created_by } = PaymentHistoryData;

    // Insert the payment history
    const [result] = await db.execute(
        'INSERT INTO payment_history (patient_id, amount, note, created_at, created_by) VALUES (?, ?, ?, ?, ?)',
        [patientId, amount, note, created_at, created_by]
    );

    // Get the created payment history
    const createdPatientHistory = await getPaymentHistoryById(result.insertId);

    // Return the created payment history
    return createdPatientHistory ?? null;
};

// Get payment history by id
/*
    @param {number} paymentHistoryId
    @returns {object}
*/
const getPaymentHistoryById = async (paymentHistoryId) => {
    const [rows] = await db.execute(
        `
        SELECT 
            ph.*,

            -- Created by (string)
            u.name AS created_by,

            -- Patient as object
            IF(
                p.id IS NULL,
                NULL,
                JSON_OBJECT(
                    'id', p.id,
                    'name', p.name
                )
            ) AS patient

        FROM payment_history ph
        LEFT JOIN users u 
            ON ph.created_by = u.id
        LEFT JOIN patients p 
            ON ph.patient_id = p.id
        WHERE ph.id = ?
        LIMIT 1
        `,
        [paymentHistoryId]
    );

    const payment = rows[0] ?? null;

    // Parse patient JSON if needed
    if (payment?.patient && typeof payment.patient === 'string') {
        payment.patient = JSON.parse(payment.patient);
    }

    return payment;
};

// Get payment history by patient id OR date
/*
    @param {number} page
    @param {number} limit
    @param {string} search
    @param {number} patientId
    @param {string} paymentDate
    @returns {object}
*/
const getPaymentHistory = async (
    page = 1,
    limit = 10,
    search = "",
    patientId = null,
    paymentDate = null // YYYY-MM-DD
) => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const params = [searchPattern, searchPattern];

    // WHERE clause (qualified columns)
    let whereClause = `(ph.amount LIKE ? OR p.name LIKE ?)`;

    // Filter by patient id
    if (patientId) {
        whereClause += ` AND ph.patient_id = ?`;
        params.push(patientId);
    }

    // Filter by date
    if (paymentDate) {
        whereClause += ` AND DATE(ph.created_at) = ?`;
        params.push(paymentDate);
    }

    params.push(limit, offset);

    // -------- DATA QUERY --------
    const [rows] = await db.execute(
        `
        SELECT 
            ph.id,
            ph.amount,
            ph.note,
            ph.created_at,
            ph.created_by,

            -- Created by (string)
            u.name AS created_by,

            -- Patient as object
            IF(
                p.id IS NULL,
                NULL,
                JSON_OBJECT(
                    'id', p.id,
                    'name', p.name
                )
            ) AS patient

        FROM payment_history ph
        LEFT JOIN users u 
            ON ph.created_by = u.id
        LEFT JOIN patients p 
            ON ph.patient_id = p.id
        WHERE ${whereClause}
        ORDER BY ph.created_at DESC
        LIMIT ? OFFSET ?
        `,
        params
    );

    // -------- COUNT QUERY --------
    const countParams = [searchPattern, searchPattern];
    let countWhere = `(ph.amount LIKE ? OR ph.created_at LIKE ?)`;

    if (patientId) {
        countWhere += ` AND ph.patient_id = ?`;
        countParams.push(patientId);
    }

    if (paymentDate) {
        countWhere += ` AND DATE(ph.created_at) = ?`;
        countParams.push(paymentDate);
    }

    const [[{ total }]] = await db.execute(
        `
        SELECT COUNT(*) AS total
        FROM payment_history ph
        WHERE ${countWhere}
        `,
        countParams
    );

    // Parse patient JSON
    const formattedRows = rows.map((ph) => ({
        ...ph,
        patient: ph.patient ? JSON.parse(ph.patient) : null,
    }));

    return {
        items: formattedRows,
        currentPage: page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
    };
};

// Delete payment history by id
/*
    @param {number} paymentHistoryId
    @returns {boolean}
*/
const deletePaymentHistoryById = async (paymentHistoryId) => {
    const [result] = await db.execute(
        'DELETE FROM payment_history WHERE id = ?',
        [paymentHistoryId]
    );

    return result.affectedRows > 0;
};

export default {
    addPaymentHistory,
    getPaymentHistoryById,
    getPaymentHistory,
    deletePaymentHistoryById,
};
