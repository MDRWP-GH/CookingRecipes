document.addEventListener('DOMContentLoaded', () => {
    // 1. ตรวจสอบสถานะ Login จาก LocalStorage
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    const guestNav = document.getElementById('guest-nav');
    const userNav = document.getElementById('user-nav');
    
    // สลับ Navbar ตามสถานะ
    if (userId) {
        // --- กรณี Login แล้ว ---
        if(guestNav) guestNav.classList.add('hidden');    // ซ่อนปุ่ม Login
        if(userNav) userNav.classList.remove('hidden');   // โชว์ปุ่ม Profile
        
        // อัปเดตชื่อใน Dropdown (ถ้ามี element)
        const ddName = document.querySelector('.dd-name');
        const ddUser = document.querySelector('.dd-username');
        if(ddName) ddName.innerText = username || 'ผู้ใช้งาน';
        if(ddUser) ddUser.innerText = '@user_' + userId;

    } else {
        // --- กรณี User ทั่วไป ---
        if(guestNav) guestNav.classList.remove('hidden');
        if(userNav) userNav.classList.add('hidden');
    }

    // 2. Logic เปิด/ปิด Dropdown (Code เดิมของคุณ)
    const profileToggle = document.getElementById('profile-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    let isDropdownOpen = false;

    if(profileToggle && userDropdown) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if(!isDropdownOpen) {
                userDropdown.classList.remove('hidden');
                // Animation เปิด
                anime({
                    targets: userDropdown,
                    opacity: [0, 1],
                    translateY: [-10, 0],
                    duration: 200,
                    easing: 'easeOutQuad'
                });
                isDropdownOpen = true;
            } else {
                // Animation ปิด
                anime({
                    targets: userDropdown,
                    opacity: [1, 0],
                    translateY: [0, -10],
                    duration: 200,
                    easing: 'easeInQuad',
                    complete: () => {
                        userDropdown.classList.add('hidden');
                    }
                });
                isDropdownOpen = false;
            }
        });

        // ปิดเมื่อคลิกข้างนอก
        document.addEventListener('click', () => {
            if(isDropdownOpen) {
                userDropdown.classList.add('hidden');
                isDropdownOpen = false;
            }
        });
    }

    // 3. ปุ่ม Logout (สำคัญ! ต้องลบข้อมูลออก)
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // ลบข้อมูลออกจากเครื่อง
            localStorage.clear(); 
            // รีเฟรชหน้าจอ
            window.location.href = 'Login.html'; 
        });
    }
});