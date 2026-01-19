require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // ใช้เข้ารหัส Password
const path = require('path');

const app = express();
app.use(express.json()); // อ่าน JSON จาก Frontend
app.use(express.static(path.join(__dirname))); // Serve root directory
app.use(express.static(path.join(__dirname, 'public'))); // ให้ HTML/CSS/JS ทำงานได้

// Root route - serve home.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// 1. Database Connection (Pool)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // ใส่รหัส MySQL ของคุณ
    database: 'my_project_db',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// 2. Register API
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    // Validation เบื้องต้น
    if (!firstName || !lastName || !username || !email || !password) {
        return res.status(400).json({ msg: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ msg: 'รหัสผ่านยืนยันไม่ตรงกัน' });
    }

    try {
        // เช็คว่ามี User ซ้ำไหม
        const [existing] = await pool.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) {
            return res.status(400).json({ msg: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
        }

        // เข้ารหัส Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // บันทึกข้อมูล
        await pool.execute(
            'INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, username, email, hashedPassword]
        );

        res.status(201).json({ msg: 'สมัครสมาชิกสำเร็จ!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 3. Login API (รองรับทั้ง Username และ Email)
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier คือ username หรือ email

    try {
        // Query หา User จาก Username หรือ Email
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?', 
            [identifier, identifier]
        );

        if (users.length === 0) {
            return res.status(400).json({ msg: 'ไม่พบชื่อผู้ใช้หรืออีเมลนี้' });
        }

        const user = users[0];

        // ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // Login สำเร็จ (ในโปรเจคจริงควรส่ง JWT Token กลับไป)
        res.json({ msg: 'เข้าสู่ระบบสำเร็จ!', userId: user.id, username: user.username });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));