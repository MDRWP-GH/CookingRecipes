document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) {
    alert('ไม่พบรหัสสูตรอาหาร');
    window.location.href = 'home.html';
    return;
  }

  try {
    const res = await fetch(`/api/recipes/${recipeId}`);
    if (!res.ok) throw new Error('Recipe not found');
    const data = await res.json();

    renderRecipe(data);

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

  const authorUrl = data.author_image ? `/uploads/${data.author_image}` : 'https://via.placeholder.com/40';
  document.getElementById('author-img').src = authorUrl;

  // วันที่
  const date = new Date(data.created_at);
  document.getElementById('post-date').innerText = date.toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // --- Ingredients ---
  const ingList = document.getElementById('ingredient-list');
  let ingHtml = '';
  (data.ingredients || []).forEach(ing => {
    ingHtml += `<li>${escapeHtml(ing.item_name)}</li>`;
  });
  ingList.innerHTML = ingHtml || '<li>ไม่มีข้อมูลวัตถุดิบ</li>';

  // --- Steps ---
  const stepList = document.getElementById('step-list');
  let stepHtml = '';
  (data.steps || []).forEach(step => {
    stepHtml += `
      <div class="step-item">
        <div class="step-num">${escapeHtml(step.step_number)}</div>
        <div class="step-desc">${escapeHtml(step.instruction)}</div>
      </div>
    `;
  });
  stepList.innerHTML = stepHtml || '<p>ไม่มีขั้นตอนวิธีทำ</p>';

  // --- ✅ ปุ่มถังขยะ: เฉพาะเจ้าของโพสต์ ---
  const currentUserId = String(localStorage.getItem('userId') || '').trim();
  const ownerId = String(data.user_id || '').trim();

  if (currentUserId && ownerId && currentUserId === ownerId) {
    ensureDeleteButton(data.id);
  }
}

function ensureDeleteButton(recipeId) {
  // กันสร้างซ้ำ
  if (document.getElementById('delete-recipe-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'delete-recipe-btn';
  btn.className = 'btn-delete-recipe';
  btn.innerHTML = `<i class='bx bx-trash'></i>`;
  btn.title = 'ลบสูตรอาหาร';

  btn.addEventListener('click', async () => {
    const ok = confirm('ต้องการลบสูตรอาหารนี้ใช่ไหม? (ลบแล้วกู้คืนไม่ได้)');
    if (!ok) return;

    const userId = localStorage.getItem('userId');
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (!res.ok) {
        const j = await safeJson(res);
        alert(j?.msg || 'ลบไม่สำเร็จ');
        return;
      }

      alert('ลบสูตรอาหารสำเร็จ');
      window.location.href = 'home.html';
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาด');
    }
  });

  document.body.appendChild(btn);

  // ⭐ เด้งนิดๆ ตอนโชว์
  if (window.anime) {
    anime({
      targets: btn,
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 350,
      easing: 'easeOutBack'
    });
  }
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
