// js/profile.js (วางทับทั้งไฟล์)

document.addEventListener('DOMContentLoaded', () => {
  // 1) ดึงข้อมูล User จาก LocalStorage
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');

  if (!username || !userId) {
    window.location.href = 'Login.html';
    return;
  }

  // ชื่อ/ยูสเซอร์
  const nameEl = document.getElementById('display-name');
  if (nameEl) nameEl.innerText = username;

  const userEl = document.getElementById('display-username');
  if (userEl) userEl.innerText = '@user_' + userId;

  // (ถ้าหน้าโปรไฟล์มีรูป)
  const profileImgEl = document.getElementById('profile-image'); // ถ้าใน HTML มี <img id="profile-image">
  const profileImage = localStorage.getItem('profile_image') || '';
  if (profileImgEl) {
    profileImgEl.src = profileImage ? `/uploads/${profileImage}` : 'https://via.placeholder.com/120';
  }

  // โหลดสูตรของฉัน
  loadMyRecipes(userId);

  // 2) Tab Switching Logic
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      document.getElementById(targetId)?.classList.remove('hidden');
    });
  });
});

// --- ฟังก์ชันดึงสูตรอาหารของฉัน (ให้เหมือนหน้า Home) ---
async function loadMyRecipes(userId) {
  const container = document.getElementById('recipes');
  if (!container) return;

  try {
    const res = await fetch(`/api/user/recipes?user_id=${userId}`);
    if (!res.ok) throw new Error('fetch failed');
    const recipes = await res.json();

    if (!Array.isArray(recipes) || recipes.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:#888;">คุณยังไม่มีสูตรอาหาร</p>`;
      return;
    }

    // รูปโปรไฟล์ผู้เขียน (เราเอง)
    const profileImage = localStorage.getItem('profile_image') || '';
    const authorImg = profileImage ? `/uploads/${profileImage}` : 'https://via.placeholder.com/30';
    const authorName = localStorage.getItem('username') || 'Unknown';

    let html = `<div class="recipe-grid">`;

    recipes.forEach(item => {
      const imgSrc = item.cover_image
        ? `/uploads/${item.cover_image}`
        : 'https://via.placeholder.com/280x200?text=No+Image';

      html += `
        <div class="recipe-card" onclick="window.location.href='recipe-detail.html?id=${item.id}'">
          <div class="card-img-wrapper">
            <img src="${imgSrc}" class="card-img" alt="${escapeHtml(item.title || '')}">
          </div>

          <div class="card-content">
            <h3 class="card-title">${escapeHtml(item.title || '')}</h3>
            <div class="card-info">
              <span><i class='bx bx-time'></i> ${escapeHtml(item.cooking_time || '-')}</span>
              <span style="margin-left:10px;"><i class='bx bx-user'></i> สำหรับ ${escapeHtml(item.servings || '-')} ท่าน</span>
            </div>

            <div class="card-footer">
              <img src="${authorImg}" class="author-img" alt="author">
              <span class="author-name">${escapeHtml(authorName)}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Animation แบบเดียวกับ Home
    if (window.anime) {
      anime({
        targets: '#recipes .recipe-card',
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 650,
        delay: anime.stagger(70),
        easing: 'easeOutExpo'
      });
    }
  } catch (err) {
    console.error('Error loading recipes:', err);
    container.innerHTML = `<p style="text-align:center; color:red;">โหลดข้อมูลไม่สำเร็จ</p>`;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
