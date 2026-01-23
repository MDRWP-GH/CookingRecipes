require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer'); // เพิ่ม: สำหรับจัดการไฟล์อัปโหลด
const fs = require('fs');         // เพิ่ม: สำหรับจัดการไฟล์ระบบ (สร้างโฟลเดอร์)
const cors = require('cors');

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json()); // อ่าน JSON จาก Frontend
app.use(express.urlencoded({ extended: true })); // อ่าน Form Data (สำคัญมากสำหรับ upload)
app.use(express.static(path.join(__dirname))); // Serve root
app.use(express.static(path.join(__dirname, 'public'))); // Serve public folder

// --- Database Connection (Pool) ---
const pool = mysql.createPool({
    host: 'localhost',
    port: 8889,        // <--- เพิ่มบรรทัดนี้ครับ (สำคัญมากสำหรับ MAMP!)
    user: 'root',
    password: 'root',  // รหัสของ MAMP ถูกแล้วครับ
    database: 'my_project_db',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// --- Multer Configuration (การตั้งค่าอัปโหลดรูป) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // สร้างโฟลเดอร์ public/uploads ถ้ายังไม่มี
        const dir = './public/uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์: recipe-เวลา-เลขสุ่ม.นามสกุลเดิม
        cb(null, 'recipe-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ================= ROUTES =================

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// 0. ต้องเอาตัว "ดึงทั้งหมด" (Specific Route) ไว้ก่อน
app.get('/api/recipes/all', async (req, res) => {
    try {
        const sql = `
            SELECT r.*, u.username, u.profile_image as author_image 
            FROM recipes r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `;
        const [rows] = await pool.execute(sql);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 1. Register API
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
        return res.status(400).json({ msg: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ msg: 'รหัสผ่านยืนยันไม่ตรงกัน' });
    }

    try {
        const [existing] = await pool.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) {
            return res.status(400).json({ msg: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

// 2. Login API
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?', 
            [identifier, identifier]
        );

        if (users.length === 0) {
            return res.status(400).json({ msg: 'ไม่พบชื่อผู้ใช้หรืออีเมลนี้' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'รหัสผ่านไม่ถูกต้อง' });
        }

        res.json({ msg: 'เข้าสู่ระบบสำเร็จ!', userId: user.id, username: user.username });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 3. Update User Profile API
app.put('/api/user/update', async (req, res) => {
    const { id, username, email, bio } = req.body;

    if (!id) {
        return res.status(400).json({ msg: 'ไม่พบ User ID' });
    }

    try {
        const [existing] = await pool.execute(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ msg: 'ชื่อผู้ใช้หรืออีเมลนี้มีคนอื่นใช้แล้ว' });
        }

        await pool.execute(
            'UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?',
            [username, email, bio, id]
        );

        res.json({ msg: 'อัปเดตข้อมูลสำเร็จ!', username, bio });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'เกิดข้อผิดพลาดที่ Server' });
    }
});

// 4. Create Recipe API (เพิ่มสูตรอาหาร)
// ใช้ upload.single('coverImage') เพื่อรับไฟล์รูปภาพ
app.post('/api/recipes', upload.single('coverImage'), async (req, res) => {
    const conn = await pool.getConnection(); // ขอ Connection แยกเพื่อทำ Transaction
    try {
        await conn.beginTransaction(); // เริ่ม Transaction

        const { user_id, title, servings, cooking_time } = req.body;
        const filename = req.file ? req.file.filename : null; // ชื่อไฟล์รูป (ถ้ามี)

        // 4.1 บันทึกตาราง Recipes
        const [result] = await conn.execute(
            'INSERT INTO recipes (user_id, title, servings, cooking_time, cover_image) VALUES (?, ?, ?, ?, ?)',
            [user_id, title, servings, cooking_time, filename]
        );
        
        const recipeId = result.insertId; // ได้ ID ของสูตรที่เพิ่งสร้าง

        // 4.2 บันทึกส่วนผสม (Ingredients)
        let ingredients = req.body.ingredients || [];
        // แปลงให้เป็น Array เสมอ (ป้องกันกรณีส่งมาตัวเดียวแล้วเป็น String)
        if (!Array.isArray(ingredients)) ingredients = [ingredients]; 

        for (const item of ingredients) {
            if(item) {
                await conn.execute(
                    'INSERT INTO ingredients (recipe_id, item_name) VALUES (?, ?)',
                    [recipeId, item]
                );
            }
        }

        // 4.3 บันทึกวิธีทำ (Steps)
        let steps = req.body.steps || [];
        if (!Array.isArray(steps)) steps = [steps];

        let stepNum = 1;
        for (const instruction of steps) {
            if(instruction) {
                await conn.execute(
                    'INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
                    [recipeId, stepNum++, instruction]
                );
            }
        }

        await conn.commit(); // ยืนยันการบันทึกทั้งหมด
        res.status(201).json({ msg: 'บันทึกสูตรอาหารสำเร็จ!', recipeId: recipeId });

    } catch (err) {
        await conn.rollback(); // ย้อนกลับข้อมูลทั้งหมดหากเกิด Error
        console.error(err);
        res.status(500).json({ msg: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
        conn.release(); // คืน Connection กลับสู่ Pool
    }
});

// 5. Get Favorites API (ดึงรายการโปรด)
app.get('/api/favorites', async (req, res) => {
    const { user_id } = req.query;
    try {
        // JOIN 3 ตาราง: Favorites -> Recipes -> Ingredients (เพื่อเอาชื่อมาโชว์นิดหน่อย)
        // หมายเหตุ: SQL นี้ดึงข้อมูลพื้นฐานมาแสดงในการ์ด
        const sql = `
            SELECT 
                f.recipe_id, 
                f.created_at as favorited_at,
                r.title, 
                r.cover_image,
                u.username as author_name
            FROM favorites f
            JOIN recipes r ON f.recipe_id = r.id
            JOIN users u ON r.user_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `;
        const [rows] = await pool.execute(sql, [user_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 6. Delete Favorite API (ลบรายการโปรด)
app.delete('/api/favorites', async (req, res) => {
    const { user_id, recipe_id } = req.body;
    try {
        await pool.execute(
            'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
            [user_id, recipe_id]
        );
        res.json({ msg: 'Deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Error' });
    }
});

// 7. Get User Recipes API (ดึงสูตรของ User คนนั้นๆ)
app.get('/api/user/recipes', async (req, res) => {
    const { user_id } = req.query;
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC',
            [user_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 8. Get Single Recipe API (ดึงรายละเอียดสูตรตาม ID - ตัวนี้แหละที่ขาดไป!)
app.get('/api/recipes/:id', async (req, res) => {
    const recipeId = req.params.id;
    try {
        // 1. ดึงข้อมูลสูตร + คนเขียน
        const [recipeRows] = await pool.execute(`
            SELECT r.*, u.username, u.profile_image as author_image 
            FROM recipes r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.id = ?
        `, [recipeId]);

        if (recipeRows.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบสูตรอาหารนี้' });
        }
        const recipe = recipeRows[0];

        // 2. ดึงส่วนผสม
        const [ingredientRows] = await pool.execute(
            'SELECT * FROM ingredients WHERE recipe_id = ?', 
            [recipeId]
        );

        // 3. ดึงวิธีทำ
        const [stepRows] = await pool.execute(
            'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC', 
            [recipeId]
        );

        // ส่งข้อมูลกลับไป
        res.json({
            ...recipe,
            ingredients: ingredientRows,
            steps: stepRows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));