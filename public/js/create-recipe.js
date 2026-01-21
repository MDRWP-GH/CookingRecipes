document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. จัดการรูปภาพหน้าปก ---
    const coverUploadBox = document.getElementById('coverUploadBox');
    const coverImageInput = document.getElementById('coverImage');

    coverUploadBox.addEventListener('click', () => {
        coverImageInput.click();
    });

    coverImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                coverUploadBox.style.backgroundImage = `url(${event.target.result})`;
                coverUploadBox.style.backgroundSize = 'cover';
                coverUploadBox.style.backgroundPosition = 'center';
                // ซ่อน Text ข้างใน
                coverUploadBox.querySelectorAll('i, p, span').forEach(el => el.style.display = 'none');
            }
            reader.readAsDataURL(file);
        }
    });

    // --- 2. ฟังก์ชันเพิ่มส่วนผสม (Ingredients) ---
    const ingredientList = document.getElementById('ingredient-list');
    const addIngredientBtn = document.getElementById('addIngredientBtn');

    addIngredientBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'list-item';
        // เพิ่ม class 'ingredient-input' เพื่อให้ดึงค่าง่ายๆ ตอนกดบันทึก
        div.innerHTML = `
            <i class='bx bx-menu drag-handle'></i>
            <input type="text" class="input-rounded ingredient-input" placeholder="วัตถุดิบ / ปริมาณ">
            <i class='bx bx-trash menu-icon' style="cursor: pointer; color: #F87171;"></i>
        `;
        
        div.querySelector('.bx-trash').addEventListener('click', () => {
            div.remove();
        });

        ingredientList.appendChild(div);
    });

    // --- 3. ฟังก์ชันเพิ่มวิธีทำ (Steps) ---
    const stepList = document.getElementById('step-list');
    const addStepBtn = document.getElementById('addStepBtn');

    function updateStepNumbers() {
        const steps = stepList.querySelectorAll('.step-number');
        steps.forEach((step, index) => {
            step.innerText = index + 1;
        });
    }

    addStepBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'step-item';
        // เพิ่ม class 'step-input' เพื่อให้ดึงค่าง่ายๆ
        div.innerHTML = `
            <div class="step-header">
                <div class="step-number"></div>
                <i class='bx bx-menu drag-handle'></i>
                <input type="text" class="input-rounded step-input" placeholder="อธิบายวิธีการทำ...">
                <i class='bx bx-trash menu-icon' style="cursor: pointer; color: #F87171;"></i>
            </div>
            <div class="step-upload">
                <i class='bx bx-camera'></i>
                </div>
        `;

        div.querySelector('.bx-trash').addEventListener('click', () => {
            div.remove();
            updateStepNumbers(); 
        });

        stepList.appendChild(div);
        updateStepNumbers(); 
    });

    updateStepNumbers();

    // --- 4. ปุ่ม Action (ส่วนที่ผสาน Backend เข้าไป) ---
    const postBtn = document.querySelector('.btn-post');

    postBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // ห้าม Refresh หน้า

        // 4.1 ตรวจสอบสิทธิ์ (ต้อง Login ก่อน)
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบก่อนเขียนสูตร');
            window.location.href = 'Login.html';
            return;
        }

        // 4.2 เปลี่ยนสถานะปุ่ม (Loading)
        const originalText = postBtn.innerText;
        postBtn.innerText = 'กำลังบันทึก...';
        postBtn.disabled = true;

        try {
            // 4.3 เตรียมข้อมูลใส่ FormData
            const formData = new FormData();
            
            // ข้อมูลหลัก
            formData.append('user_id', userId);
            formData.append('title', document.querySelector('.input-line').value);
            formData.append('servings', document.querySelector('.servings-group input').value || 1);
            formData.append('cooking_time', document.querySelector('.time-group input').value || '');

            // รูปปก (ถ้ามี)
            const coverFile = document.getElementById('coverImage').files[0];
            if (coverFile) {
                formData.append('coverImage', coverFile);
            }

            // ข้อมูลส่วนผสม (Loop เก็บจากหน้าจอ)
            const ingredients = document.querySelectorAll('.ingredient-input');
            ingredients.forEach(input => {
                if(input.value.trim() !== "") {
                    formData.append('ingredients[]', input.value.trim());
                }
            });

            // ข้อมูลวิธีทำ (Loop เก็บจากหน้าจอ)
            const steps = document.querySelectorAll('.step-input');
            steps.forEach(input => {
                if(input.value.trim() !== "") {
                    formData.append('steps[]', input.value.trim());
                }
            });

            // 4.4 ส่งไปที่ Server (Backend)
            const res = await fetch('/api/recipes', {
                method: 'POST',
                body: formData // ไม่ต้อง set Content-Type (Browser ทำให้เอง)
            });

            const result = await res.json();

            if (res.ok) {
                alert('โพสต์สูตรอาหารสำเร็จ!');
                window.location.href = 'home.html'; // กลับหน้าหลัก
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.msg);
            }

        } catch (err) {
            console.error(err);
            alert('ไม่สามารถเชื่อมต่อกับ Server ได้');
        } finally {
            // คืนค่าปุ่มกลับเป็นเหมือนเดิม
            postBtn.innerText = originalText;
            postBtn.disabled = false;
        }
    });

    // ปุ่มลบ (Cancel)
    document.querySelector('.btn-delete').addEventListener('click', () => {
        if(confirm('ต้องการยกเลิกและกลับไปหน้าหลักใช่หรือไม่?')) {
            window.location.href = 'home.html';
        }
    });
});