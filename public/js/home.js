// js/home.js (วางทับทั้งไฟล์) - ตรงกับ backend ของคุณ

let ALL_RECIPES = [];
let FAVORITE_SET = new Set(); // recipe_id ที่ user กดโปรด (มาจาก DB)

const FAVORITE_REQUIRE_LOGIN = true;

document.addEventListener("DOMContentLoaded", async () => {
  // โหลด recipes ก่อน
  await loadAllRecipes();

  // โหลด favorites จาก DB (ถ้าล็อกอิน)
  await loadFavoriteIdsFromDB();

  // render
  renderRecipeCards(ALL_RECIPES);

  // Search main
  const mainInput = document.getElementById("main-search-input");
  const mainBtn = document.getElementById("main-search-btn");
  if (mainBtn && mainInput) {
    mainBtn.addEventListener("click", applyFiltersAndRender);
    mainInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyFiltersAndRender();
    });
  }

  // Filter bar
  const filterBtn =
    document.getElementById("filter-search-btn") ||
    document.querySelector(".btn-filter-search");
  if (filterBtn) filterBtn.addEventListener("click", applyFiltersAndRender);
});

async function loadAllRecipes() {
  try {
    const res = await fetch("/api/recipes/all");
    if (!res.ok) {
      console.error("Failed to fetch recipes");
      renderEmpty("โหลดสูตรอาหารไม่สำเร็จ");
      return;
    }
    const recipes = await res.json();
    ALL_RECIPES = Array.isArray(recipes) ? recipes : [];
  } catch (err) {
    console.error("Error loading recipes:", err);
    renderEmpty("เกิดข้อผิดพลาดในการโหลดข้อมูล");
  }
}

// ✅ ใช้ API ที่คุณมีจริง: GET /api/favorites?user_id=...
async function loadFavoriteIdsFromDB() {
  try {
    if (FAVORITE_REQUIRE_LOGIN && !hasAuth()) {
      FAVORITE_SET = new Set();
      return;
    }

    const userId = String(localStorage.getItem("userId") || "").trim();
    if (!userId) {
      FAVORITE_SET = new Set();
      return;
    }

    const res = await fetch(`/api/favorites?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      FAVORITE_SET = new Set();
      return;
    }

    const rows = await res.json();
    // rows: [{recipe_id, ...}, ...]
    FAVORITE_SET = new Set((Array.isArray(rows) ? rows : []).map((r) => String(r.recipe_id)));
  } catch (e) {
    console.error("loadFavoriteIdsFromDB error:", e);
    FAVORITE_SET = new Set();
  }
}

/**
 * รวม logic ค้นหา + กรอง แล้ว render
 */
function applyFiltersAndRender() {
  const keyword = (document.getElementById("main-search-input")?.value || "")
    .trim()
    .toLowerCase();

  const category = (document.getElementById("category-filter")?.value || "").trim();
  const difficulty = (document.getElementById("difficulty-filter")?.value || "").trim();

  let filtered = ALL_RECIPES.slice();

  if (keyword) {
    filtered = filtered.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const ingRaw = item.ingredients ?? item.ingredient ?? item.ing ?? "";
      const ingredientsText = Array.isArray(ingRaw) ? ingRaw.join(" ") : String(ingRaw || "");
      const desc = String(item.description || item.detail || item.steps || "").toLowerCase();
      const haystack = (title + " " + ingredientsText + " " + desc).toLowerCase();
      return haystack.includes(keyword);
    });
  }

  if (category) {
    filtered = filtered.filter((item) => {
      const v = item.category ?? item.type ?? item.menu_type ?? item.recipe_type ?? "";
      return String(v).trim().toLowerCase() === category.toLowerCase();
    });
  }

  if (difficulty) {
    filtered = filtered.filter((item) => {
      const v = item.difficulty ?? item.level ?? item.cooking_level ?? item.method_level ?? "";
      return String(v).trim().toLowerCase() === difficulty.toLowerCase();
    });
  }

  renderRecipeCards(filtered);
}

/**
 * Render cards
 */
function renderRecipeCards(recipes) {
  const grid = document.getElementById("recipe-grid");
  if (!grid) return;

  if (!recipes || recipes.length === 0) {
    renderEmpty("ไม่พบสูตรอาหารที่ตรงกับการค้นหา/ตัวกรอง");
    return;
  }

  let html = "";

  recipes.forEach((item) => {
    const id = item.id;

    const imgSrc = item.cover_image
      ? `/uploads/${item.cover_image}`
      : "https://via.placeholder.com/280x200?text=No+Image";

    const authorImg = item.author_image
      ? `/uploads/${item.author_image}`
      : "https://via.placeholder.com/30";

    const authorName = item.username || item.author_name || "Unknown";
    const isFav = FAVORITE_SET.has(String(id));

    html += `
      <div class="recipe-card" onclick="window.location.href='recipe-detail.html?id=${id}'">
        <div class="card-img-wrapper">
          <img src="${imgSrc}" class="card-img" alt="${escapeHtml(item.title || "")}">
          
          <button class="btn-favorite ${isFav ? "active" : ""}"
                  onclick="toggleFavorite(event, ${id})"
                  aria-label="favorite">
            <i class='bx ${isFav ? "bxs-heart" : "bx-heart"}'></i>
          </button>
        </div>

        <div class="card-content">
          <h3 class="card-title">${escapeHtml(item.title || "")}</h3>
          <div class="card-info">
            <span><i class='bx bx-time'></i> ${escapeHtml(item.cooking_time || "-")}</span>
            <span style="margin-left:10px;"><i class='bx bx-user'></i> สำหรับ ${escapeHtml(item.servings || "-")} ท่าน</span>
          </div>

          <div class="card-footer">
            <img src="${authorImg}" class="author-img" alt="author">
            <span class="author-name">${escapeHtml(authorName)}</span>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  if (window.anime) {
    anime({
      targets: ".recipe-card",
      translateY: [30, 0],
      opacity: [0, 1],
      duration: 700,
      delay: anime.stagger(70),
      easing: "easeOutExpo"
    });
  }
}

/**
 * ⭐ กดหัวใจ: เด้ง + บันทึก DB จริง (ใช้ API ของคุณ)
 * - POST /api/favorites {user_id, recipe_id}
 * - DELETE /api/favorites {user_id, recipe_id}
 */
async function toggleFavorite(event, recipeId) {
  event.preventDefault();
  event.stopPropagation();

  if (FAVORITE_REQUIRE_LOGIN && !hasAuth()) {
    alert("กรุณาเข้าสู่ระบบก่อนใช้งานรายการโปรด");
    return;
  }

  const userId = String(localStorage.getItem("userId") || "").trim();
  if (!userId) {
    alert("ไม่พบ userId กรุณาเข้าสู่ระบบใหม่");
    return;
  }

  const btn = event.currentTarget;
  const icon = btn.querySelector("i");
  const key = String(recipeId);
  const isFavNow = FAVORITE_SET.has(key);
  const newState = !isFavNow;

  // Optimistic UI + ⭐ เด้ง
  setFavButtonUI(btn, icon, newState);
  heartPop(btn);

  try {
    let res;

    if (newState) {
      res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(userId), recipe_id: Number(recipeId) })
      });
    } else {
      res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(userId), recipe_id: Number(recipeId) })
      });
    }

    if (!res.ok) throw new Error("API failed");

    // อัปเดต state หลังสำเร็จ
    if (newState) FAVORITE_SET.add(key);
    else FAVORITE_SET.delete(key);
  } catch (e) {
    console.error("toggleFavorite error:", e);

    // rollback
    setFavButtonUI(btn, icon, isFavNow);
    alert("บันทึกรายการโปรดไม่สำเร็จ กรุณาลองใหม่");
  }
}

function setFavButtonUI(btn, icon, isFav) {
  btn.classList.toggle("active", isFav);
  icon.classList.toggle("bx-heart", !isFav);
  icon.classList.toggle("bxs-heart", isFav);
}

// ⭐ Animation เด้งหัวใจ
function heartPop(btn) {
  if (!window.anime) return;
  anime.remove(btn);
  anime({
    targets: btn,
    scale: [1, 1.22, 1],
    rotate: [0, -8, 0],
    duration: 420,
    easing: "easeOutBack"
  });
}

function hasAuth() {
  return !!localStorage.getItem("userId");
}

function renderEmpty(message) {
  const grid = document.getElementById("recipe-grid");
  if (!grid) return;
  grid.innerHTML = `<p style="text-align:center; width:100%; color:#888;">${escapeHtml(message)}</p>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
