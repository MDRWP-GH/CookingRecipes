require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Connection (Pool) ---
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'cookapp',
  password: '123456',
  database: 'my_project_db',
  waitForConnections: true,
  connectionLimit: 10
}).promise();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'recipe-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
<<<<<<< HEAD
=======
// --- Multer for Profile Image ---
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadProfile = multer({ storage: profileStorage });

>>>>>>> 73f580b031af0ff1f5fb792fef96874b24ffc275

// ================= ROUTES =================

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// 0) Get all recipes
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

// 1) Register
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, username, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ msg: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'รหัสผ่านยืนยันไม่ตรงกัน' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
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

// 2) Login
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

// 3) Update profile
app.put('/api/user/update', async (req, res) => {
  const { id, username, email, bio } = req.body;

  if (!id) return res.status(400).json({ msg: 'ไม่พบ User ID' });

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

// 4) Create recipe + notification "โพสต์สำเร็จแล้ว"
app.post('/api/recipes', upload.single('coverImage'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { user_id, title, servings, cooking_time } = req.body;
    const filename = req.file ? req.file.filename : null;

    const [result] = await conn.execute(
      'INSERT INTO recipes (user_id, title, servings, cooking_time, cover_image) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, servings, cooking_time, filename]
    );
    const recipeId = result.insertId;

    // Ingredients
    let ingredients = req.body.ingredients || [];
    if (!Array.isArray(ingredients)) ingredients = [ingredients];
    for (const item of ingredients) {
      if (item) {
        await conn.execute(
          'INSERT INTO ingredients (recipe_id, item_name) VALUES (?, ?)',
          [recipeId, item]
        );
      }
    }

    // Steps
    let steps = req.body.steps || [];
    if (!Array.isArray(steps)) steps = [steps];
    let stepNum = 1;
    for (const instruction of steps) {
      if (instruction) {
        await conn.execute(
          'INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
          [recipeId, stepNum++, instruction]
        );
      }
    }

    // ✅ Notification: post_success
    await conn.execute(
      "INSERT INTO notifications (user_id, type, message, ref_text) VALUES (?, ?, ?, ?)",
      [user_id, "post_success", "โพสต์สำเร็จแล้ว", `“${title}”`]
    );

    await conn.commit();
    res.status(201).json({ msg: 'บันทึกสูตรอาหารสำเร็จ!', recipeId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ msg: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    conn.release();
  }
});

// 5) Get favorites
app.get('/api/favorites', async (req, res) => {
  const { user_id } = req.query;
  try {
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

// 6) Add favorite + notification to recipe owner
app.post('/api/favorites', async (req, res) => {
  const { user_id, recipe_id } = req.body;
  if (!user_id || !recipe_id) {
    return res.status(400).json({ msg: 'missing user_id or recipe_id' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // กันกดซ้ำ
    const [exists] = await conn.execute(
      "SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ? LIMIT 1",
      [user_id, recipe_id]
    );
    if (exists.length > 0) {
      await conn.rollback();
      return res.json({ msg: 'already_favorited' });
    }

    // เพิ่ม favorite
    await conn.execute(
      "INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)",
      [user_id, recipe_id]
    );

    // หาเจ้าของสูตร + ชื่อสูตร
    const [rrows] = await conn.execute(
      "SELECT user_id AS owner_id, title FROM recipes WHERE id = ?",
      [recipe_id]
    );

    if (rrows.length > 0) {
      const ownerId = rrows[0].owner_id;
      const title = rrows[0].title;

      // หา username คนกด favorite
      const [urows] = await conn.execute(
        "SELECT username FROM users WHERE id = ?",
        [user_id]
      );
      const actorName = urows.length ? urows[0].username : "ผู้ใช้";

      // แจ้งเจ้าของสูตร (ไม่แจ้งตัวเอง)
      if (Number(ownerId) !== Number(user_id)) {
        await conn.execute(
          "INSERT INTO notifications (user_id, type, message, ref_text) VALUES (?, ?, ?, ?)",
          [ownerId, "favorite", `${actorName} เพิ่มโพสต์ของคุณลงในรายการโปรด`, `“${title}”`]
        );
      }
    }

    await conn.commit();
    res.json({ msg: 'favorited' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  } finally {
    conn.release();
  }
});

// 7) Delete favorite
app.delete('/api/favorites', async (req, res) => {
  const { user_id, recipe_id } = req.body;
  try {
    await pool.execute(
      'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
      [user_id, recipe_id]
    );
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error' });
  }
});

// 8) Get user recipes
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

// 9) Get single recipe
app.get('/api/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;
  try {
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

    const [ingredientRows] = await pool.execute(
      'SELECT * FROM ingredients WHERE recipe_id = ?',
      [recipeId]
    );

    const [stepRows] = await pool.execute(
      'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC',
      [recipeId]
    );

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

<<<<<<< HEAD
=======
/* =========================================================
   ✅ 9.5) DELETE RECIPE (เฉพาะเจ้าของสูตรเท่านั้น) + ลบรูป
   ========================================================= */
app.delete('/api/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ msg: 'missing user_id' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // หาเจ้าของ + cover_image
    const [rows] = await conn.execute(
      'SELECT user_id, title, cover_image FROM recipes WHERE id = ?',
      [recipeId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ msg: 'ไม่พบสูตรอาหารนี้' });
    }

    const ownerId = rows[0].user_id;
    const title = rows[0].title;
    const coverImage = rows[0].cover_image;

    // เช็คสิทธิ์: เฉพาะเจ้าของ
    if (Number(ownerId) !== Number(user_id)) {
      await conn.rollback();
      return res.status(403).json({ msg: 'คุณไม่มีสิทธิ์ลบสูตรนี้' });
    }

    // ลบ recipe (ตารางลูกจะ cascade)
    await conn.execute('DELETE FROM recipes WHERE id = ?', [recipeId]);

    // (OPTION) ลบไฟล์รูปปกใน uploads ด้วย
    if (coverImage) {
      const filePath = path.join(__dirname, 'public', 'uploads', coverImage);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        // ไม่ให้ fail เพราะลบไฟล์ไม่สำเร็จ (แค่ log)
        console.warn('Delete cover image failed:', e.message);
      }
    }

    // แจ้งเตือนตัวเอง (optional)
    await conn.execute(
      "INSERT INTO notifications (user_id, type, message, ref_text) VALUES (?, ?, ?, ?)",
      [user_id, "delete_success", "ลบสูตรอาหารสำเร็จ", `“${title}”`]
    );

    await conn.commit();
    res.json({ msg: 'deleted' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  } finally {
    conn.release();
  }
});

>>>>>>> 73f580b031af0ff1f5fb792fef96874b24ffc275
// 10) Delete account
app.post("/api/user/delete", async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ msg: "กรุณาส่ง userId และ password" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [users] = await conn.execute("SELECT id, password FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      await conn.rollback();
      return res.status(404).json({ msg: "ไม่พบบัญชีผู้ใช้" });
    }

    const user = users[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      await conn.rollback();
      return res.status(401).json({ msg: "รหัสผ่านไม่ถูกต้อง" });
    }

<<<<<<< HEAD
    const [recipeRows] = await conn.execute("SELECT id FROM recipes WHERE user_id = ?", [userId]);
=======
    const [recipeRows] = await conn.execute("SELECT id, cover_image FROM recipes WHERE user_id = ?", [userId]);
>>>>>>> 73f580b031af0ff1f5fb792fef96874b24ffc275
    const recipeIds = recipeRows.map(r => r.id);

    await conn.execute("DELETE FROM favorites WHERE user_id = ?", [userId]);
    await conn.execute("DELETE FROM notifications WHERE user_id = ?", [userId]);

    if (recipeIds.length > 0) {
      const placeholders = recipeIds.map(() => "?").join(",");
      await conn.execute(`DELETE FROM ingredients WHERE recipe_id IN (${placeholders})`, recipeIds);
      await conn.execute(`DELETE FROM recipe_steps WHERE recipe_id IN (${placeholders})`, recipeIds);
      await conn.execute(`DELETE FROM recipes WHERE id IN (${placeholders})`, recipeIds);
    }

<<<<<<< HEAD
=======
    // (OPTION) ลบรูปของ recipe ที่ user นี้เคยอัปโหลด
    for (const r of recipeRows) {
      if (r.cover_image) {
        const filePath = path.join(__dirname, 'public', 'uploads', r.cover_image);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (_) {}
      }
    }

>>>>>>> 73f580b031af0ff1f5fb792fef96874b24ffc275
    await conn.execute("DELETE FROM users WHERE id = ?", [userId]);

    await conn.commit();
    res.json({ msg: "ลบบัญชีสำเร็จ" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  } finally {
    conn.release();
  }
});

// 11) Get notifications
app.get("/api/notifications", async (req, res) => {
  const { user_id, limit = 20 } = req.query;
  if (!user_id) return res.status(400).json({ msg: "missing user_id" });

  try {
    const [rows] = await pool.execute(
      `SELECT id, type, message, ref_text, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [user_id, Number(limit)]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// 12) Mark notification as read
app.post("/api/notifications/read", async (req, res) => {
  const { user_id, notification_id } = req.body;
  if (!user_id || !notification_id) {
    return res.status(400).json({ msg: "missing user_id or notification_id" });
  }

  try {
    await pool.execute(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [notification_id, user_id]
    );
    res.json({ msg: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
<<<<<<< HEAD
=======
});

// Upload profile image
app.post('/api/user/profile-image', uploadProfile.single('profileImage'), async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ msg: 'missing user_id' });
  if (!req.file) return res.status(400).json({ msg: 'missing file' });

  try {
    // (OPTION) ลบรูปเดิมในเครื่อง
    const [rows] = await pool.execute('SELECT profile_image FROM users WHERE id = ?', [user_id]);
    const oldImg = rows.length ? rows[0].profile_image : null;

    await pool.execute(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [req.file.filename, user_id]
    );

    if (oldImg) {
      const oldPath = path.join(__dirname, 'public', 'uploads', oldImg);
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (_) {}
    }

    res.json({ msg: 'ok', profile_image: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
>>>>>>> 73f580b031af0ff1f5fb792fef96874b24ffc275
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
