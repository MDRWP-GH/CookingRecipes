document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('recipe-grid');

    // ข้อมูลจำลอง (Mock Data)
    const recipes = [
        { title: 'ต้มยำกุ้งน้ำข้น', cat: 'ต้ม', region: 'ไทย', author: 'Chef Ton' },
        { title: 'แกงเขียวหวานไก่', cat: 'แกง', region: 'กลาง', author: 'Mama Kitchen' },
        { title: 'ข้าวกะเพราหมูสับ', cat: 'ผัด', region: 'ไทย', author: 'Street Food King' },
        { title: 'ส้มตำปูปลาร้า', cat: 'ตำ', region: 'อีสาน', author: 'Zaap Nua' },
        { title: 'หมูสามชั้นทอดน้ำปลา', cat: 'ทอด', region: 'ทั่วไป', author: 'Crispy Pork' },
        { title: 'ต้มข่าไก่', cat: 'ต้ม', region: 'ไทย', author: 'Coconut Soup' },
    ];

    // สร้าง HTML
    let cardHTML = '';
recipes.forEach(item => {
    cardHTML += `
    <div class="recipe-card">
        <div class="card-img"
             style="background-image:url('/uploads/${item.cover_image || 'default.jpg'}')">
        </div>

        <div class="card-content">
            <h3 class="card-title">${item.title}</h3>
            <div class="card-info"><span>เวลา:</span> ${item.cooking_time || '-'}</div>
            <div class="card-info"><span>สำหรับ:</span> ${item.servings || 1} ที่</div>

            <div class="card-footer">
                <div class="author-img"></div>
                <span class="author-name">${item.author}</span>
            </div>
        </div>
    </div>
    `;
});

grid.innerHTML = cardHTML;


    grid.innerHTML = cardHTML;

    // Animation ตอนโหลดหน้า
    anime({
        targets: '.recipe-card',
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(100),
        easing: 'easeOutExpo'
    });
});
