// public/js/delete-account.js

document.addEventListener("DOMContentLoaded", () => {
  const cancelBtn = document.getElementById("cancelBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const passwordEl = document.getElementById("password");

  // ต้องมี userId จากตอน login
  const userId = localStorage.getItem("userId");

  // ถ้ายังไม่ login -> กลับไปหน้า login
  if (!userId) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "Login.html";
    return;
  }

  // ปุ่มยกเลิก -> กลับหน้า settings
  cancelBtn.addEventListener("click", () => {
    window.location.href = "settings.html";
  });

  // กด Enter ในช่องรหัสผ่าน = ลบ
  passwordEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") deleteBtn.click();
  });

  // ปุ่มลบบัญชี -> เรียก API
  deleteBtn.addEventListener("click", async () => {
    const password = (passwordEl.value || "").trim();

    if (!password) {
      alert("กรุณาใส่รหัสผ่านเพื่อยืนยัน");
      passwordEl.focus();
      return;
    }

    // ยืนยันอีกชั้น
    const ok = confirm("คุณแน่ใจหรือไม่? บัญชีจะถูกลบถาวรและกู้คืนไม่ได้");
    if (!ok) return;

    // กันกดรัว
    deleteBtn.disabled = true;
    deleteBtn.textContent = "กำลังลบ...";

    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.msg || "ลบบัญชีไม่สำเร็จ");
        return;
      }

      // ล้างข้อมูล login
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("token");

      alert("ลบบัญชีสำเร็จ");
      window.location.href = "home.html";

    } catch (err) {
      console.error(err);
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.textContent = "ลบบัญชี";
      passwordEl.value = "";
    }
  });
});
