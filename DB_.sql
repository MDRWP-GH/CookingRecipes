CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,     -- ชื่อจริง
    last_name VARCHAR(100) NOT NULL,      -- นามสกุล
    username VARCHAR(50) NOT NULL UNIQUE, -- ชื่อผู้ใช้ (ห้ามซ้ำ)
    email VARCHAR(100) NOT NULL UNIQUE,   -- อีเมล (ห้ามซ้ำ)
    password VARCHAR(255) NOT NULL,       -- รหัสผ่าน (ที่เข้ารหัสแล้ว)
    bio TEXT,                             -- คำอธิบายแนะนำตัว (Profile Bio)
    profile_image VARCHAR(255),           -- เก็บชื่อไฟล์รูปโปรไฟล์ (เช่น 'avatar-1.jpg')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- เวลาที่สมัคร
);

CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,              -- ใครเป็นคนเขียน (Foreign Key)
    title VARCHAR(255) NOT NULL,       -- ชื่อเมนู
    servings INT DEFAULT 1,            -- สำหรับกี่ที่
    cooking_time VARCHAR(100),         -- เวลาที่ใช้
    cover_image VARCHAR(255),          -- ชื่อไฟล์รูปปก
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,            -- ผูกกับสูตรไหน
    item_name VARCHAR(255) NOT NULL,   -- ชื่อวัตถุดิบ + ปริมาณ
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,            -- ผูกกับสูตรไหน
    step_number INT NOT NULL,          -- ขั้นตอนที่ 1, 2, 3...
    instruction TEXT NOT NULL,         -- คำอธิบายวิธีทำ
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,              -- ใครเป็นคนกด like
    recipe_id INT NOT NULL,            -- กด like สูตรไหน
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, recipe_id) -- ป้องกันการกดซ้ำ (1 คนกด like สูตรเดิมได้แค่ครั้งเดียว)
);

