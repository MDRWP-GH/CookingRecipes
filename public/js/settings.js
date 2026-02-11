// public/js/settings.js

document.addEventListener("DOMContentLoaded", () => {
  // ---------- 1) ปุ่มเขียนสูตร ----------
  const createBtn = document.getElementById("createBtn");
  if (createBtn) {
    createBtn.addEventListener("click", () => {
      window.location.href = "create-recipe.html";
    });
  }

  // ---------- 2) กดแถว "ลบบัญชีของคุณ" ไปหน้า delete-account ----------
  const deleteRow = document.getElementById("deleteAccountRow");
  if (deleteRow) {
    deleteRow.addEventListener("click", () => {
      window.location.href = "delete-account.html";
    });
  }

  // ---------- 3) การแจ้งเตือน เปิด/ปิด (เก็บค่าไว้จริง) ----------
  const notifyBtns = document.querySelectorAll(".settings-mini-btn[data-notify]");
  const savedNotify = localStorage.getItem("notifyEnabled"); // "on" | "off" | null
  const currentNotify = savedNotify || "on";

  setNotifyActive(currentNotify);

  notifyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.notify; // on/off
      localStorage.setItem("notifyEnabled", v);
      setNotifyActive(v);
      toast(v === "on" ? "เปิดการแจ้งเตือนแล้ว" : "ปิดการแจ้งเตือนแล้ว");
    });
  });

  function setNotifyActive(value) {
    notifyBtns.forEach(b => b.classList.remove("is-active"));
    const activeBtn = document.querySelector(`.settings-mini-btn[data-notify="${value}"]`);
    if (activeBtn) activeBtn.classList.add("is-active");
  }

  // ---------- 4) ออกจากระบบ (ปุ่มกลางหน้า) ----------
  const logoutBtn2 = document.getElementById("logoutBtn2");
  if (logoutBtn2) {
    logoutBtn2.addEventListener("click", doLogout);
  }

  // ---------- 5) ออกจากระบบ (ปุ่มใน dropdown) ----------
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", doLogout);
  }

  function doLogout() {
    // ล้างข้อมูล login ที่คุณใช้เก็บไว้ (ปรับชื่อ key ให้ตรงของคุณได้)
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

    // (ถ้าคุณเก็บ token/ข้อมูลอื่น ให้ลบเพิ่มตรงนี้)
    localStorage.removeItem("token");

    window.location.href = "home.html";
  }

  // ---------- 6) Toast เล็ก ๆ ----------
  function toast(text) {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "24px";
    el.style.transform = "translateX(-50%)";
    el.style.background = "#111";
    el.style.color = "#fff";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "12px";
    el.style.fontWeight = "700";
    el.style.fontSize = "14px";
    el.style.boxShadow = "0 10px 25px rgba(0,0,0,0.18)";
    el.style.zIndex = "9999";
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.transition = "opacity .25s";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 260);
    }, 1200);
  }
});


