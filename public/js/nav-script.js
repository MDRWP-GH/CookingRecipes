document.addEventListener('DOMContentLoaded', () => {
    // 1. ตรวจสอบสถานะ Login (จำลอง)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; 

    const guestNav = document.getElementById('guest-nav');
    const userNav = document.getElementById('user-nav');
    
    // สลับ Navbar ตามสถานะ
    if (isLoggedIn) {
        guestNav.classList.add('hidden');
        userNav.classList.remove('hidden');
    } else {
        guestNav.classList.remove('hidden');
        userNav.classList.add('hidden');
    }

    // 2. Logic เปิด/ปิด Dropdown แบบมี Anime.js ทั้งไปและกลับ
    const profileToggle = document.getElementById('profile-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    let isDropdownOpen = false;
    let isAnimating = false; // กันคนกดรัวๆ แล้ว Animation เพี้ยน

    if(profileToggle) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isAnimating) return; // ถ้ากำลังขยับอยู่ ห้ามกดซ้ำ

            if(!isDropdownOpen) {
                // --- จังหวะเปิด (OPEN) ---
                userDropdown.classList.remove('hidden');
                isAnimating = true;
                
                anime({
                    targets: userDropdown,
                    opacity: [0, 1],      // จากใส เป็น ทึบ
                    translateY: [-10, 0], // เลื่อนลงนิดนึง
                    scale: [0.95, 1],     // ขยายจากเล็กไปใหญ่
                    duration: 300,
                    easing: 'easeOutExpo',
                    complete: () => { isAnimating = false; }
                });
                isDropdownOpen = true;

            } else {
                // --- จังหวะปิด (CLOSE) ---
                isAnimating = true;

                anime({
                    targets: userDropdown,
                    opacity: [1, 0],      // จากทึบ เป็น ใส
                    translateY: [0, -10], // เลื่อนกลับขึ้นไป
                    duration: 200,
                    easing: 'easeInQuad', // ใช้ Easing แบบเร่งออก
                    complete: () => {
                        userDropdown.classList.add('hidden'); // ซ่อนจริงๆ เมื่อ Animation จบ
                        isAnimating = false;
                    }
                });
                isDropdownOpen = false;
            }
        });
    }

    // ปิด Dropdown เมื่อคลิกข้างนอก (เพิ่ม Animation ปิดด้วย)
    document.addEventListener('click', () => {
        if(isDropdownOpen && !isAnimating) {
            isAnimating = true;
            anime({
                targets: userDropdown,
                opacity: [1, 0],
                translateY: [0, -10],
                duration: 200,
                easing: 'easeInQuad',
                complete: () => {
                    userDropdown.classList.add('hidden');
                    isAnimating = false;
                    isDropdownOpen = false;
                }
            });
        }
    });

    // หยุดการปิดเมื่อคลิกภายในตัวเมนูเอง
    if(userDropdown) {
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 3. ปุ่ม Logout
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.setItem('isLoggedIn', 'false');
            window.location.reload(); 
        });
    }
});