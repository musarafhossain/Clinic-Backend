import db from '../config/db.js';

// Create disease
/*
    @param {Object} diseaseData - Disease data
    @param {string} diseaseData.name - Disease name
    @param {number} diseaseData.amount - Disease amount
    @param {number} diseaseData.created_by - Disease created by
    @param {number} diseaseData.updated_by - Disease updated by
    @param {string} diseaseData.created_at - Disease created at
    @param {string} diseaseData.updated_at - Disease updated at
    @returns {Promise<Object>} - Disease data
*/
const createDisease = async (diseaseData) => {
    // // Destructure user data
    const { name, amount, created_by, updated_by, created_at, updated_at } = diseaseData;

    // Insert disease
    const [result] = await db.execute(
        `INSERT INTO diseases (name, amount, created_at, created_by, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [name, amount, created_at, created_by, updated_at, updated_by]
    );

    // Get created disease
    const createdDisease = await getDiseaseById(result.insertId);

    // Return disease data
    return createdDisease;
};

// Get all diseases
/*
    @param {number} page - Page number
    @param {number} limit - Limit number
    @param {string} search - Search string
    @returns {Promise<Object>} - Disease data
*/
const getAllDiseases = async (page = 1, limit, search = "") => {
    // Create search pattern
    const searchPattern = `%${search}%`;

    // Check limit
    const noLimit = !limit || limit === "all";

    // Initialize rows and total
    let rows, total;

    // If no limit
    if (noLimit) {
        // Get all diseases
        const [allRows] = await db.execute(
            `
            SELECT 
                d.id,
                d.name,
                d.amount,
                d.created_at,
                d.updated_at,
                IFNULL(cu.name, NULL) AS created_by,
                IFNULL(uu.name, NULL) AS updated_by
            FROM diseases d
            LEFT JOIN users cu ON d.created_by = cu.id
            LEFT JOIN users uu ON d.updated_by = uu.id
            WHERE d.name LIKE ?
            ORDER BY d.id DESC
            `,
            [searchPattern]
        );

        // Set rows and total
        rows = allRows;
        total = allRows.length;

        // Return all diseases
        return {
            items: rows,
            currentPage: 1,
            limit: total,
            total,
            lastPage: 1,
        };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get paged diseases
    const [pagedRows] = await db.execute(
        `
        SELECT 
            d.id,
            d.name,
            d.amount,
            d.created_at,
            d.updated_at,
            IFNULL(cu.name, NULL) AS created_by,
            IFNULL(uu.name, NULL) AS updated_by
        FROM diseases d
        LEFT JOIN users cu ON d.created_by = cu.id
        LEFT JOIN users uu ON d.updated_by = uu.id
        WHERE d.name LIKE ?
        ORDER BY d.id DESC
        LIMIT ? OFFSET ?
        `,
        [searchPattern, limit, offset]
    );

    // Get total count
    const [[{ total: count }]] = await db.execute(
        `
        SELECT COUNT(*) AS total
        FROM diseases
        WHERE name LIKE ?
        `,
        [searchPattern]
    );

    // Return paged diseases
    return {
        items: pagedRows,
        currentPage: page,
        limit,
        total: count,
        lastPage: Math.ceil(count / limit),
    };
};

// Get disease by id
/*
    @param {number} diseaseId - Disease id
    @returns {Promise<Object>} - Disease data
*/
const getDiseaseById = async (diseaseId) => {
    // Get disease by id
    const [rows] = await db.execute(
        `
        SELECT 
            d.id,
            d.name,
            d.amount,
            d.created_at,
            d.updated_at,
            IFNULL(cu.name, NULL) AS created_by,
            IFNULL(uu.name, NULL) AS updated_by
        FROM diseases d
        LEFT JOIN users cu ON d.created_by = cu.id
        LEFT JOIN users uu ON d.updated_by = uu.id
        WHERE d.id = ?
        LIMIT 1
        `,
        [diseaseId]
    );

    // Return disease data
    return rows[0] || null;
};

// Get disease by name
/*
    @param {string} name - Disease name
    @returns {Promise<Object>} - Disease data
*/
const getDiseaseByName = async (name) => {
    // Get disease by name
    const [rows] = await db.execute(
        `
        SELECT 
            d.id,
            d.name,
            d.amount,
            d.created_at,
            d.updated_at,
            IFNULL(cu.name, NULL) AS created_by,
            IFNULL(uu.name, NULL) AS updated_by
        FROM diseases d
        LEFT JOIN users cu ON d.created_by = cu.id
        LEFT JOIN users uu ON d.updated_by = uu.id
        WHERE d.name = ?
        LIMIT 1
        `,
        [name]
    );

    // Return disease data
    return rows[0] || null;
};

// Update disease by id
/*
    @param {number} diseaseId - Disease id
    @param {Object} diseaseData - Disease data
    @param {string} diseaseData.name - Disease name
    @param {number} diseaseData.amount - Disease amount
    @param {number} diseaseData.updated_by - Disease updated by
    @param {string} diseaseData.updated_at - Disease updated at
    @returns {Promise<Object>} - Disease data
*/
const updateDiseaseById = async (diseaseId, diseaseData) => {
    // Update disease by id
    const { name, amount, updated_by, updated_at } = diseaseData;

    // Update disease
    await db.execute(
        `UPDATE diseases 
        SET name = ?, amount = ?, updated_by = ?, updated_at = ? 
        WHERE id = ?`,
        [name, amount, updated_by, updated_at, diseaseId]
    );

    // Get updated disease
    const updatedDisease = await getDiseaseById(diseaseId);

    // Return updated disease
    return updatedDisease;
};

// Check disease exist
/*
    @param {number} diseaseId - Disease id
    @param {string} name - Disease name
    @returns {Promise<boolean>} - True if disease exist
*/
const checkDiseaseExist = async (diseaseId, name) => {
    // Check disease exist
    const [existing] = await db.execute(
        "SELECT id FROM diseases WHERE name = ? AND id != ?",
        [name, diseaseId]
    );

    // Return true if disease exist
    return existing.length > 0;
};

// Delete disease by id
/*
    @param {number} diseaseId - Disease id
    @returns {Promise<boolean>} - True if deleted
*/
const deleteDiseaseById = async (diseaseId) => {
    // Delete disease by id
    await db.execute('DELETE FROM diseases WHERE id = ?', [diseaseId]);

    // Return true
    return true;
};

export default {
    createDisease,
    getAllDiseases,
    getDiseaseById,
    getDiseaseByName,
    checkDiseaseExist,
    updateDiseaseById,
    deleteDiseaseById,
};