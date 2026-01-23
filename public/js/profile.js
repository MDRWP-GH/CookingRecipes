document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ดึงข้อมูล User จาก LocalStorage
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');

    if(username) {
        const nameEl = document.getElementById('display-name');
        if(nameEl) nameEl.innerText = username;
        
        const userEl = document.getElementById('display-username');
        if(userEl) userEl.innerText = '@user_' + userId;
        
        // --- เรียกฟังก์ชันดึงสูตรอาหาร ---
        loadMyRecipes(userId);
    } else {
        window.location.href = 'Login.html';
    }

    // 2. Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.add('hidden'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });
});

// --- ฟังก์ชันดึงสูตรอาหารของฉัน ---
async function loadMyRecipes(userId) {
    try {
        const res = await fetch(`/api/user/recipes?user_id=${userId}`);
        const recipes = await res.json();
        const container = document.getElementById('recipes');

        if (recipes.length > 0) {
            // สร้าง Grid
            let html = '<div class="recipe-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">';
            
            recipes.forEach(item => {
                const imgSrc = item.cover_image ? `/uploads/${item.cover_image}` : 'https://via.placeholder.com/200';
                
                // ✅ เพิ่ม onclick="..." ตรงนี้
                html += `
                <div class="recipe-card" onclick="window.location.href='recipe-detail.html?id=${item.id}'" 
                     style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #eee; cursor: pointer;">
                    
                    <div style="height: 150px; overflow: hidden;">
                        <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="padding: 15px; text-align: left;">
                        <h4 style="margin: 0 0 5px 0; font-size: 1rem;">${item.title}</h4>
                        <p style="font-size: 0.8rem; color: #666; margin: 0;">${item.cooking_time || 'ไม่ระบุเวลา'}</p>
                    </div>
                </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        } 
        
    } catch (err) {
        console.error('Error loading recipes:', err);
    }
}