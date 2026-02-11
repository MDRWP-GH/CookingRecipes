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
        const res = await fetch(`/api/favorites?user_id=${userId}`);
        const favorites = await res.json();

        favCountSpan.innerText = favorites.length;

        if (favorites.length === 0) {
            listContainer.innerHTML =
                '<div class="empty-state">ยังไม่มีรายการโปรด</div>';
            return;
        }

        let html = '';
        favorites.forEach(item => {

            const imgSrc = item.cover_image
                ? `/uploads/${item.cover_image}`
                : 'https://via.placeholder.com/280x200?text=No+Image';

            html += `
            <div class="recipe-card" onclick="window.location.href='recipe-detail.html?id=${item.recipe_id}'">
                <div class="card-img-wrapper">
                    <img src="${imgSrc}" class="card-img">

                    <!-- ❤️ หัวใจเหมือนหน้า Home -->
                    <button class="btn-favorite active"
                            onclick="removeFavorite(event, ${item.recipe_id})">
                        <i class='bx bxs-heart'></i>
                    </button>
                </div>

                <div class="card-content">
                    <h3 class="card-title">${item.title}</h3>
                </div>
            </div>
            `;
        });

        listContainer.innerHTML = html;

        // animation โหลดการ์ด
        if (window.anime) {
            anime({
                targets: '.recipe-card',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: anime.stagger(80),
                easing: 'easeOutQuad'
            });
        }

    } catch (err) {
        console.error(err);
        listContainer.innerHTML =
            '<p style="text-align:center; color:red;">โหลดข้อมูลไม่สำเร็จ</p>';
    }
});

// ❤️ ลบ favorite (เหมือนหน้า Home)
async function removeFavorite(e, recipeId) {
    e.preventDefault();
    e.stopPropagation();

    const userId = localStorage.getItem('userId');
    const btn = e.currentTarget;

    try {
        const res = await fetch('/api/favorites', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                recipe_id: recipeId
            })
        });

        if (res.ok) {

            // ⭐ เด้งก่อนลบ
            if (window.anime) {
                anime({
                    targets: btn,
                    scale: [1, 1.2, 1],
                    duration: 350,
                    easing: 'easeOutBack'
                });
            }

            // ลบการ์ดออกจาก DOM
            setTimeout(() => {
                btn.closest('.recipe-card').remove();

                const count = document.getElementById('fav-count');
                count.innerText = parseInt(count.innerText) - 1;

                if (parseInt(count.innerText) === 0) {
                    document.getElementById('favorites-list').innerHTML =
                        '<div class="empty-state">ยังไม่มีรายการโปรด</div>';
                }
            }, 250);
        }

    } catch (err) {
        alert('เกิดข้อผิดพลาด');
    }
}
