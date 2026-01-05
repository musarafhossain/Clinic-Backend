import db from '../config/db.js';

// Create a new patient
/*
    @param {Object} patientData
    @param {string} patientData.name
    @param {string} patientData.age
    @param {string} patientData.gender
    @param {string} patientData.status
    @param {string} patientData.disease
    @param {string} patientData.phone
    @param {string} patientData.address
    @param {string} patientData.created_at
    @param {string} patientData.created_by
    @param {string} patientData.updated_at
    @param {string} patientData.updated_by
    @returns {Promise<Object | null>}
*/
const createPatient = async (patientData) => {
    // Destructure the patient data
    const { name, age, gender, status, disease, phone, address, created_at, created_by, updated_at, updated_by, } = patientData;

    // Insert the patient into the database
    const [result] = await db.execute(
        `INSERT INTO patients 
        (name, age, gender, status, disease, phone, address, created_at, created_by, updated_at, updated_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, age, gender, status, disease, phone, address, created_at, created_by, updated_at, updated_by]
    );

    // Get the created patient
    const createdPatient = await getPatientById(result.insertId);

    // Return the created patient
    return createdPatient ?? null;
};

// Get all patients
/*
    @param {Object} params
    @param {number} params.page
    @param {number} params.limit
    @param {string} params.search
    @param {string} params.status
    @returns {Promise<Object | null>}
*/
const getAllPatients = async (page = 1, limit = 10, search = "", status = "") => {
    // Calculate the offset
    const offset = (page - 1) * limit;

    // Create the search pattern
    const searchPattern = `%${search}%`;

    // Create the parameters array
    const params = [searchPattern, searchPattern];

    // Create the where clause
    let whereClause = `(p.name LIKE ? OR p.phone LIKE ?)`;

    // Add the status to the where clause if it exists
    if (status) {
        whereClause += ` AND p.status = ?`;
        params.push(status);
    }

    // Add the limit and offset to the parameters array
    params.push(limit, offset);

    // Execute the query
    const [rows] = await db.execute(
        `
        SELECT 
            p.id,
            p.name,
            p.age,
            p.gender,
            p.status,
            p.phone,
            p.address,
            p.created_at,
            p.updated_at,

            uc.name AS created_by,
            uu.name AS updated_by,

            -- Calculated fields
            (
                SELECT COALESCE(SUM(ph.amount), 0)
                FROM payment_history ph
                WHERE ph.patient_id = p.id
            ) AS amount_paid,

            (
                SELECT COALESCE(SUM(a.disease_amount), 0)
                FROM attendances a
                WHERE a.patient_id = p.id
            ) AS total_bill,

            (
                SELECT COUNT(*)
                FROM attendances a
                WHERE a.patient_id = p.id
            ) AS total_attendance,

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

    // Calculate the total number of patients
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

    // Format the rows
    const formattedRows = rows.map((p) => ({
        ...p,
        disease: p.disease ? JSON.parse(p.disease) : null,
    }));

    // Return the formatted rows
    return {
        items: formattedRows,
        currentPage: page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
    };
};

// Get patient by id
/*
    @param {number} patientId
    @returns {Promise<Object | null>}
*/
const getPatientById = async (patientId) => {
    // Get patient by id
    const [rows] = await db.execute(
        `
        SELECT
            p.id,
            p.name,
            p.age,
            p.gender,
            p.status,
            p.phone,
            p.address,
            p.created_at,
            p.updated_at,

            -- Created by user name
            uc.name AS created_by,

            -- Updated by user name
            uu.name AS updated_by,

            -- Calculated fields
            (
                SELECT COALESCE(SUM(ph.amount), 0)
                FROM payment_history ph
                WHERE ph.patient_id = p.id
            ) AS amount_paid,

            (
                SELECT COALESCE(SUM(a.disease_amount), 0)
                FROM attendances a
                WHERE a.patient_id = p.id
            ) AS total_bill,

            (
                SELECT COUNT(*)
                FROM attendances a
                WHERE a.patient_id = p.id
            ) AS total_attendance,

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

    // Get the first row
    const patient = rows[0] || null;

    // Parse the disease if it exists
    if (patient?.disease && typeof patient.disease === "string") {
        patient.disease = JSON.parse(patient.disease);
    }

    // Return the patient
    return patient;
};

// Update patient by id
/*
    @param {number} patientId
    @param {Object} patientData
    @param {string} patientData.name
    @param {string} patientData.father_name
    @param {string} patientData.age
    @param {string} patientData.gender
    @param {string} patientData.status
    @param {number} patientData.disease
    @param {string} patientData.phone
    @param {string} patientData.address
    @param {number} patientData.updated_by
    @param {string} patientData.updated_at
    @returns {Promise<Object | null>}
*/
const updatePatientById = async (patientId, patientData) => {
    // Destructure the patient data
    const { name, age, gender, status, disease, phone, address, updated_by, updated_at } = patientData;

    // Update the patient
    await db.execute(
        `
        UPDATE patients 
        SET 
            name = ?,
            age = ?,
            gender = ?,
            status = ?,
            disease = ?,
            phone = ?,
            address = ?,
            updated_by = ?,
            updated_at = ?
        WHERE id = ?
        `,
        [name, age, gender, status, disease, phone, address, updated_by, updated_at, patientId]
    );

    // Get the updated patient
    const updatedPatient = await getPatientById(patientId);

    // Return the updated patient
    return updatedPatient ?? null;
};

// Delete patient by id
/*
    @param {number} patientId
    @returns {Promise<boolean>}
*/
const deletePatientById = async (patientId) => {
    // Delete the patient
    await db.execute('DELETE FROM patients WHERE id = ?', [patientId]);

    // Return true
    return true;
};

export default {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatientById,
    deletePatientById,
};