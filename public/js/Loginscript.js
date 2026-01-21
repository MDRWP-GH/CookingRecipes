const loginBox = document.querySelector('#login-box');
const registerBox = document.querySelector('#register-box');

// 1. Anime.js สลับหน้าจอ
function switchForm(showRegister) {
    const outBox = showRegister ? loginBox : registerBox;
    const inBox = showRegister ? registerBox : loginBox;

    // Animation ออก
    anime({
        targets: outBox,
        opacity: [1, 0],
        translateY: -20,
        duration: 300,
        easing: 'easeInOutQuad',
        complete: () => {
            outBox.classList.add('hidden');
            inBox.classList.remove('hidden');
            
            // Animation เข้า
            anime({
                targets: inBox,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 400,
                easing: 'easeOutExpo'
            });
        }
    });
}

document.querySelector('#to-register').addEventListener('click', (e) => {
    e.preventDefault();
    switchForm(true);
});

document.querySelector('#to-login').addEventListener('click', (e) => {
    e.preventDefault();
    switchForm(false);
});

// 2. Logic การส่งข้อมูล (Register)
document.querySelector('#registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        firstName: document.querySelector('#regName').value,
        lastName: document.querySelector('#regSurname').value,
        username: document.querySelector('#regUsername').value,
        email: document.querySelector('#regEmail').value,
        password: document.querySelector('#regPass').value,
        confirmPassword: document.querySelector('#regConfirmPass').value
    };

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.msg);
    if (res.ok) switchForm(false); // สมัครผ่านให้เด้งไปหน้า Login
});

// 3. Logic การส่งข้อมูล (Login)
document.querySelector('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        identifier: document.querySelector('#loginId').value,
        password: document.querySelector('#loginPass').value
    };

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    if (res.ok) {
        alert(`ยินดีต้อนรับคุณ ${result.username}`);
        window.location.href = '/home.html'; // ไปหน้าถัดไป
    } else {
        alert(result.msg);
    }
});