// js/favorites.js (วางทับทั้งไฟล์)

document.addEventListener('DOMContentLoaded', async () => {
  const listContainer = document.getElementById('favorites-list');
  const favCountSpan = document.getElementById('fav-count');
  const userId = localStorage.getItem('userId');

  if (!userId) {
    alert('กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด');
    window.location.href = 'Login.html';
    return;
  }

  // ✅ รองรับหลายชื่อ input
  const searchInput =
    document.getElementById('searchInput') ||
    document.getElementById('searchText') ||
    document.querySelector('input[type="search"]');

  const searchForm = document.getElementById('searchForm') || null;

  // เก็บ favorites ไว้ค้นหา
  let allFavorites = [];

  // กัน submit แล้วรีเฟรช
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => e.preventDefault());
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderEmpty(text = 'ยังไม่มีรายการโปรด') {
    listContainer.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
  }

  function renderList(items, animate = true) {
    favCountSpan.innerText = String(items.length);

    if (!items.length) {
      renderEmpty('ยังไม่มีรายการโปรด');
      return;
    }

    let html = '';
    items.forEach((item) => {
      const imgSrc = item.cover_image
        ? `/uploads/${item.cover_image}`
        : 'https://via.placeholder.com/280x200?text=No+Image';

      html += `
        <div class="recipe-card" data-id="${item.recipe_id}"
             data-title="${escapeHtml(item.title)}"
             data-author="${escapeHtml(item.author_name || '')}"
             data-type="${escapeHtml(item.item_name || '')}"
             onclick="window.location.href='recipe-detail.html?id=${item.recipe_id}'">
          <div class="card-img-wrapper">
            <img src="${imgSrc}" class="card-img" alt="${escapeHtml(item.title)}">

            <!-- ❤️ หัวใจเหมือนหน้า Home -->
            <button class="btn-favorite active" type="button"
                    onclick="removeFavorite(event, ${item.recipe_id})"
                    aria-label="remove favorite">
              <i class='bx bxs-heart'></i>
            </button>
          </div>

          <div class="card-content">
            <h3 class="card-title">${escapeHtml(item.title)}</h3>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    if (animate && window.anime) {
      anime({
        targets: '.recipe-card',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(80),
        easing: 'easeOutQuad'
      });
    }
  }

  function applySearch() {
    if (!searchInput) return;

    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) {
      renderList(allFavorites, false);
      return;
    }

    const filtered = allFavorites.filter((it) => {
      const title = String(it.title || '').toLowerCase();
      const author = String(it.author_name || '').toLowerCase();
      const type = String(it.item_name || '').toLowerCase();
      return title.includes(q) || author.includes(q) || type.includes(q);
    });

    if (!filtered.length) {
      // ไม่เปลี่ยน fav-count (ยังเป็นจำนวนทั้งหมด)
      listContainer.innerHTML = `
        <div class="empty-state">ไม่พบรายการที่ค้นหา</div>
      `;
      return;
    }

    renderList(filtered, false);
  }

  // โหลดข้อมูลครั้งแรก
  try {
    const res = await fetch(`/api/favorites?user_id=${userId}`);
    const favorites = await res.json();

    allFavorites = Array.isArray(favorites) ? favorites : [];
    if (!allFavorites.length) {
      favCountSpan.innerText = '0';
      renderEmpty();
      return;
    }

    // แสดงทั้งหมดก่อน
    renderList(allFavorites, true);

    // ✅ เปิดค้นหา
    if (searchInput) {
      searchInput.addEventListener('input', applySearch);
      // ถ้ามีค่าอยู่แล้ว (เช่น browser จำไว้) ก็กรองทันที
      applySearch();
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
      body: JSON.stringify({ user_id: userId, recipe_id: recipeId })
    });

    if (res.ok) {
      if (window.anime) {
        anime({
          targets: btn,
          scale: [1, 1.2, 1],
          duration: 350,
          easing: 'easeOutBack'
        });
      }

      setTimeout(() => {
        const card = btn.closest('.recipe-card');
        if (card) card.remove();

        // update count บนหน้า
        const countEl = document.getElementById('fav-count');
        const newCount = Math.max(0, parseInt(countEl.innerText || '0', 10) - 1);
        countEl.innerText = String(newCount);

        // ถ้าลบจนหมด
        if (newCount === 0) {
          document.getElementById('favorites-list').innerHTML =
            '<div class="empty-state">ยังไม่มีรายการโปรด</div>';
        }
      }, 250);
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาด');
  }
}
