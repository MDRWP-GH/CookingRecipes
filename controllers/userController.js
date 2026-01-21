const db = require('../config/db');

exports.findById = async (id) => {
    // ใช้ ? เพื่อป้องกัน SQL Injection
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]); 
    return rows[0];
};