import db from '../config/db.js';

const loginUser = async (email) => {
    const [rows] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    return rows[0];
}

export default {
    loginUser,
}