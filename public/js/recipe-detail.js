document.addEventListener('DOMContentLoaded', async () => {
    // 1. หา ID จาก URL (เช่น recipe-detail.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        alert('ไม่พบรหัสสูตรอาหาร');
        window.location.href = 'home.html';
        return;
    }

    try {
        // 2. เรียก API
        const res = await fetch(`/api/recipes/${recipeId}`);
        if (!res.ok) throw new Error('Recipe not found');
        const data = await res.json();

        // 3. แสดงผลข้อมูล (Render)
        renderRecipe(data);

        // ซ่อน Loading -> โชว์ Content
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('recipe-content').classList.remove('hidden');

    } catch (err) {
        console.error(err);
        document.getElementById('loading').innerText = 'เกิดข้อผิดพลาด หรือไม่พบสูตรอาหารนี้';
    }
});

function renderRecipe(data) {
    // --- Header ---
    document.getElementById('recipe-title').innerText = data.title;
    document.getElementById('cooking-time').innerText = data.cooking_time || '-';
    document.getElementById('servings').innerText = data.servings || '-';
    
    // รูปปก
    const coverUrl = data.cover_image ? `/uploads/${data.cover_image}` : 'https://via.placeholder.com/400x300';
    document.getElementById('cover-img').src = coverUrl;

    // ข้อมูลผู้เขียน
    document.getElementById('author-name').innerText = data.username;
    // รูปผู้เขียน (ถ้าไม่มีให้ใช้ Placeholder)
    const authorUrl = data.author_image ? `/uploads/${data.author_image}` : 'https://via.placeholder.com/40';
    document.getElementById('author-img').src = authorUrl;

    // วันที่ (แปลงเป็นไทย)
    const date = new Date(data.created_at);
    document.getElementById('post-date').innerText = date.toLocaleDateString('th-TH', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });

    // --- Ingredients ---
    const ingList = document.getElementById('ingredient-list');
    let ingHtml = '';
    data.ingredients.forEach(ing => {
        ingHtml += `<li>${ing.item_name}</li>`;
    });
    ingList.innerHTML = ingHtml || '<li>ไม่มีข้อมูลวัตถุดิบ</li>';

    // --- Steps ---
    const stepList = document.getElementById('step-list');
    let stepHtml = '';
    data.steps.forEach(step => {
        stepHtml += `
            <div class="step-item">
                <div class="step-num">${step.step_number}</div>
                <div class="step-desc">${step.instruction}</div>
            </div>
        `;
    });
    stepList.innerHTML = stepHtml || '<p>ไม่มีขั้นตอนวิธีทำ</p>';
}