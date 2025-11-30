import db from '../config/db.js';

const createDisease = async (diseaseData) => {
    const { name, amount, created_by, updated_by } = diseaseData;
    const [result] = await db.execute(
        `INSERT INTO disease (name, amount, created_at, created_by, updated_at, updated_by)
     VALUES (?, ?, NOW(), ?, NOW(), ?)`,
        [name, amount, created_by, updated_by]
    );
    const insertedId = result.insertId;
    const row = getDiseaseById(insertedId);
    return row;
};

const getAllDiseases = async (page = 1, limit = 10, search = "") => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

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
    FROM disease d
    LEFT JOIN users cu ON d.created_by = cu.id
    LEFT JOIN users uu ON d.updated_by = uu.id
    WHERE d.name LIKE ?
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
    `,
        [searchPattern, limit, offset]
    );

    // Count total items for pagination
    const [[{ total }]] = await db.execute(
        `
    SELECT COUNT(*) AS total
    FROM disease
    WHERE name LIKE ?
    `,
        [searchPattern]
    );

    return {
        items: rows,
        currentPage: page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
    };
};

const getDiseaseById = async (diseaseId) => {
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
    FROM disease d
    LEFT JOIN users cu ON d.created_by = cu.id
    LEFT JOIN users uu ON d.updated_by = uu.id
    WHERE d.id = ?
    LIMIT 1
    `,
        [diseaseId]
    );

    return rows[0] || null;
};

const getDiseaseByName = async (name) => {
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
    FROM disease d
    LEFT JOIN users cu ON d.created_by = cu.id
    LEFT JOIN users uu ON d.updated_by = uu.id
    WHERE d.name = ?
    LIMIT 1
    `,
        [name]
    );

    return rows[0] || null;
};

const updateDiseaseById = async (diseaseId, diseaseData) => {
    const { name, amount, updated_by } = diseaseData;

    await db.execute(
        `UPDATE disease 
        SET name = ?, amount = ?, updated_by = ?, updated_at = NOW() 
        WHERE id = ?`,
        [name, amount, updated_by, diseaseId]
    );

    const row = getDiseaseById(diseaseId);
    return row;
};

const checkDiseaseExist = async (diseaseId, name) => {
    const [existing] = await db.execute(
        "SELECT id FROM disease WHERE name = ? AND id != ?",
        [name, diseaseId]
    );

    return existing.length > 0;
};

const deleteDiseaseById = async (diseaseId) => {
    await db.execute('DELETE FROM disease WHERE id = ?', [diseaseId]);
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