// public/js/notifications.js

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("notiList");
  const userId = localStorage.getItem("userId");

  // ถ้าปิดแจ้งเตือนจาก settings -> ไม่โหลด
  const notifyEnabled = localStorage.getItem("notifyEnabled") || "on";
  if (notifyEnabled === "off") {
    listEl.innerHTML = `<div class="noti-empty">ปิดการแจ้งเตือนไว้</div>`;
    return;
  }

  if (!userId) {
    listEl.innerHTML = `<div class="noti-empty">กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน</div>`;
    return;
  }

  loadNotifications(userId);

  async function loadNotifications(uid) {
    try {
      const res = await fetch(`/api/notifications?user_id=${encodeURIComponent(uid)}&limit=50`);
      const data = await res.json();

      if (!res.ok) {
        listEl.innerHTML = `<div class="noti-empty">${escapeHtml(data.msg || "โหลดแจ้งเตือนไม่สำเร็จ")}</div>`;
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        listEl.innerHTML = `<div class="noti-empty">ยังไม่มีการแจ้งเตือน</div>`;
        return;
      }

      listEl.innerHTML = "";
      data.forEach(n => listEl.appendChild(renderCard(n)));

    } catch (e) {
      console.error(e);
      listEl.innerHTML = `<div class="noti-empty">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</div>`;
    }
  }

  function renderCard(n) {
    const card = document.createElement("div");
    card.className = "noti-card";
    card.dataset.id = n.id;

    const { iconClass, iconWrapClass } = mapIcon(n.type);
    const mainClass = Number(n.is_read) === 1 ? "noti-main" : "noti-main noti-unread";

    card.innerHTML = `
      <div class="noti-icon ${iconWrapClass}">
        <i class='${iconClass}'></i>
      </div>
      <div class="noti-text">
        <div class="${mainClass}">${escapeHtml(n.message)}</div>
        <div class="noti-sub">${escapeHtml(n.ref_text || "")}</div>
      </div>
    `;

    // คลิกแล้ว mark read
    card.addEventListener("click", async () => {
      if (Number(n.is_read) === 1) return;

      await markRead(n.id);
      n.is_read = 1;

      const main = card.querySelector(".noti-main");
      if (main) main.classList.remove("noti-unread");
    });

    return card;
  }

  function mapIcon(type) {
    if (type === "post_success") {
      return { iconClass: "bx bx-check", iconWrapClass: "noti-icon-success" };
    }
    // default favorite
    return { iconClass: "bx bx-bookmark", iconWrapClass: "" };
  }

  async function markRead(notificationId) {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, notification_id: notificationId })
      });
    } catch (e) {
      console.error(e);
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
