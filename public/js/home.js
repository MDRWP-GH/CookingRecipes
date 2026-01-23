document.addEventListener('DOMContentLoaded', () => {
    loadAllRecipes();

    // ส่วนปุ่มค้นหา (Filter)
    const btnSearch = document.querySelector('.btn-filter-search');
    if(btnSearch) {
        btnSearch.addEventListener('click', () => {
             // ในอนาคตค่อยเพิ่ม Logic ค้นหา
            alert('ฟีเจอร์ค้นหากำลังพัฒนา...'); 
        });
    }
});

async function loadAllRecipes() {
    try {
        // 1. เรียก API ที่เราเพิ่งสร้าง
        const res = await fetch('/api/recipes/all');
        
        if(!res.ok) {
            console.error('Failed to fetch recipes');
            return; 
        }

        const recipes = await res.json();
        const grid = document.getElementById('recipe-grid');
        let cardHTML = '';

        if (recipes.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%; color:#888;">ยังไม่มีสูตรอาหาร เริ่มเขียนคนแรกเลย!</p>';
            return;
        }

        // 2. วนลูปสร้างการ์ด
        recipes.forEach(item => {
            // จัดการรูปภาพ (ถ้าไม่มีให้ใช้ภาพ Default)
            const imgSrc = item.cover_image ? `/uploads/${item.cover_image}` : 'https://via.placeholder.com/280x200?text=No+Image';
            const authorImg = item.author_image ? `/uploads/${item.author_image}` : 'https://via.placeholder.com/30';
            const authorName = item.username || 'Unknown';

            // สร้าง HTML การ์ด
            cardHTML += `
            <div class="recipe-card" onclick="window.location.href='recipe-detail.html?id=${item.id}'">
                <img src="${imgSrc}" class="card-img" alt="${item.title}">

                <div class="card-content">
                    <h3 class="card-title">${item.title}</h3>
                    <div class="card-info">
                        <span><i class='bx bx-time'></i> ${item.cooking_time || '-'}</span>
                        <span style="margin-left:10px;"><i class='bx bx-user'></i> สำหรับ ${item.servings || '-'} ท่าน</span>
                    </div>

                    <div class="card-footer">
                        <img src="${authorImg}" class="author-img">
                        <span class="author-name">${authorName}</span>
                    </div>
                </div>
            </div>
            `;
        });

        // 3. เอา HTML ไปใส่ในหน้าเว็บ
        grid.innerHTML = cardHTML;

        // 4. Animation สวยๆ ตอนโหลดมา
        anime({
            targets: '.recipe-card',
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 800,
            delay: anime.stagger(100),
            easing: 'easeOutExpo'
        });

    } catch (err) {
        console.error('Error loading recipes:', err);
    }
}