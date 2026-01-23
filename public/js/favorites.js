document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('favorites-list');
    const favCountSpan = document.getElementById('fav-count');
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด');
        window.location.href = 'Login.html';
        return;
    }

    try {
        // 1. ดึงข้อมูลจาก API
        const res = await fetch(`/api/favorites?user_id=${userId}`);
        const favorites = await res.json();

        favCountSpan.innerText = favorites.length;

        if (favorites.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">ยังไม่มีรายการโปรด</div>';
            return;
        }

        // 2. สร้าง HTML รายการ
        let html = '';
        favorites.forEach(item => {
            const date = new Date(item.favorited_at);
            const dateStr = date.toLocaleDateString('th-TH', { 
                day: 'numeric', month: 'long', year: 'numeric' 
            });

            const imgSrc = item.cover_image ? `/uploads/${item.cover_image}` : 'https://via.placeholder.com/180';

            // ✅ เพิ่ม onclick="..." ตรงนี้
            html += `
            <div class="fav-item" onclick="window.location.href='recipe-detail.html?id=${item.recipe_id}'">
                <img src="${imgSrc}" class="fav-img">
                <div class="fav-content">
                    <div class="fav-header">
                        <div>
                            <h3 class="fav-name">${item.title}</h3>
                            <p class="fav-desc">ประเภท: ${item.item_name || 'ทั่วไป'}</p> 
                        </div>
                        
                        <button class="btn-bookmark" onclick="removeFavorite(event, ${item.recipe_id})">
                            <i class='bx bxs-bookmark'></i>
                        </button>
                    </div>
                    
                    <div class="fav-footer">
                        <div class="author-avatar"></div> 
                        <span class="author-name">ชื่อคนเขียนสูตร</span>
                        <span class="save-date">บันทึกเมื่อ ${dateStr}</span>
                    </div>
                </div>
            </div>
            `;
        });

        listContainer.innerHTML = html;

        // Animation
        anime({
            targets: '.fav-item',
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            easing: 'easeOutQuad'
        });

    } catch (err) {
        console.error(err);
        listContainer.innerHTML = '<p style="text-align:center; color:red;">โหลดข้อมูลไม่สำเร็จ</p>';
    }
});

// ฟังก์ชันลบรายการโปรด
async function removeFavorite(e, recipeId) {
    e.stopPropagation(); // ⛔ สำคัญ: หยุดไม่ให้คลิกทะลุไปโดนตัวการ์ด
    
    if(!confirm('ต้องการลบออกจากรายการโปรด?')) return;

    const userId = localStorage.getItem('userId');
    try {
        const res = await fetch('/api/favorites', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, recipe_id: recipeId })
        });

        if(res.ok) {
            e.target.closest('.fav-item').remove();
            const count = document.getElementById('fav-count');
            count.innerText = parseInt(count.innerText) - 1;
        }
    } catch(err) {
        alert('เกิดข้อผิดพลาด');
    }
}