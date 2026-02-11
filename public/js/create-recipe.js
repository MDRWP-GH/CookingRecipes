// js/create-recipe.js (วางทับทั้งไฟล์)
// ✅ เพิ่มอัปโหลดรูปในแต่ละ Step (กดไอคอนกล้องแล้วเลือกไฟล์)
// ✅ Preview รูป + ลบรูปได้
// ✅ ส่งไป Backend เป็น stepImages + stepImageIndex (กันรูปสลับขั้น)
// ✅ รองรับกรณีบาง Step ไม่มีรูป

document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     1) รูปภาพหน้าปก
     ========================= */
  const coverUploadBox = document.getElementById('coverUploadBox');
  const coverImageInput = document.getElementById('coverImage');

  if (coverUploadBox && coverImageInput) {
    coverUploadBox.addEventListener('click', () => coverImageInput.click());

    coverImageInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        coverUploadBox.style.backgroundImage = `url(${event.target.result})`;
        coverUploadBox.style.backgroundSize = 'cover';
        coverUploadBox.style.backgroundPosition = 'center';
        coverUploadBox.querySelectorAll('i, p, span').forEach(el => el.style.display = 'none');
      };
      reader.readAsDataURL(file);
    });
  }

  /* =========================
     2) Ingredients
     ========================= */
  const ingredientList = document.getElementById('ingredient-list');
  const addIngredientBtn = document.getElementById('addIngredientBtn');

  if (addIngredientBtn && ingredientList) {
    addIngredientBtn.addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <i class='bx bx-menu drag-handle'></i>
        <input type="text" class="input-rounded ingredient-input" placeholder="วัตถุดิบ / ปริมาณ">
        <i class='bx bx-trash menu-icon' style="cursor: pointer; color: #F87171;"></i>
      `;

      div.querySelector('.bx-trash')?.addEventListener('click', () => div.remove());
      ingredientList.appendChild(div);
    });
  }

  /* =========================
     3) Steps + รูปในแต่ละ Step
     ========================= */
  const stepList = document.getElementById('step-list');
  const addStepBtn = document.getElementById('addStepBtn');

  function updateStepNumbers() {
    const nums = stepList?.querySelectorAll('.step-number') || [];
    nums.forEach((el, idx) => el.innerText = String(idx + 1));
  }

  function validateImageFile(file) {
    if (!file) return { ok: false, msg: 'ไม่พบไฟล์' };
    if (!file.type.startsWith('image/')) return { ok: false, msg: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น' };
    if (file.size > 3 * 1024 * 1024) return { ok: false, msg: 'ไฟล์ใหญ่เกินไป (จำกัด 3MB)' };
    return { ok: true };
  }

  function makeStepPreviewBox() {
    const preview = document.createElement('div');
    preview.className = 'step-preview';
    preview.style.cssText = `
      width: 120px;
      height: 90px;
      border-radius: 10px;
      background: #f3f4f6;
      border: 1px dashed #d1d5db;
      display: none;
      background-size: cover;
      background-position: center;
    `;
    return preview;
  }

  function bindStepUpload(stepEl) {
    const uploadBox = stepEl.querySelector('.step-upload');
    if (!uploadBox) return;

    // เคลียร์ของเดิม (กัน bind ซ้ำ)
    uploadBox.innerHTML = `<i class='bx bx-camera'></i>`;

    // input file ซ่อนไว้ใน step
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'step-file';
    fileInput.hidden = true;

    // preview
    const preview = makeStepPreviewBox();

    // ปุ่มลบรูป
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'step-remove-img';
    removeBtn.innerHTML = `<i class='bx bx-x'></i>`;
    removeBtn.style.cssText = `
      border: none;
      background: #fee2e2;
      color: #ef4444;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    uploadBox.style.display = 'flex';
    uploadBox.style.alignItems = 'center';
    uploadBox.style.gap = '10px';

    // ✅ กด “ไอคอนกล้อง” เพื่อเลือกไฟล์ (ไม่ให้กดพื้นที่ว่างแล้วเด้ง)
    const cameraIcon = uploadBox.querySelector('i.bx-camera');
    if (cameraIcon) {
      cameraIcon.style.cursor = 'pointer';
      cameraIcon.title = 'เพิ่มรูปในขั้นตอนนี้';
      cameraIcon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const v = validateImageFile(file);
      if (!v.ok) {
        alert(v.msg);
        fileInput.value = '';
        return;
      }

      const url = URL.createObjectURL(file);
      preview.style.backgroundImage = `url('${url}')`;
      preview.style.display = 'block';
      removeBtn.style.display = 'inline-flex';

      if (window.anime) {
        anime({ targets: preview, scale: [0.98, 1], duration: 200, easing: 'easeOutQuad' });
      }
    });

    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.value = '';
      preview.style.backgroundImage = '';
      preview.style.display = 'none';
      removeBtn.style.display = 'none';
    });

    uploadBox.appendChild(fileInput);
    uploadBox.appendChild(preview);
    uploadBox.appendChild(removeBtn);
  }

  if (addStepBtn && stepList) {
    addStepBtn.addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'step-item';

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

      div.querySelector('.bx-trash')?.addEventListener('click', () => {
        div.remove();
        updateStepNumbers();
      });

      stepList.appendChild(div);
      bindStepUpload(div);
      updateStepNumbers();
    });

    // bind step ที่มีอยู่แล้ว (เช่น step แรกใน HTML)
    updateStepNumbers();
    stepList.querySelectorAll('.step-item')?.forEach(bindStepUpload);
  }

  /* =========================
     4) Post (ส่งไป Backend)
     ========================= */
  const postBtn = document.querySelector('.btn-post');

  if (postBtn) {
    postBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('กรุณาเข้าสู่ระบบก่อนเขียนสูตร');
        window.location.href = 'Login.html';
        return;
      }

      const originalText = postBtn.innerText;
      postBtn.innerText = 'กำลังบันทึก...';
      postBtn.disabled = true;

      try {
        const formData = new FormData();

        // ข้อมูลหลัก
        formData.append('user_id', userId);
        formData.append('title', document.querySelector('.input-line')?.value || '');
        formData.append('servings', document.querySelector('.servings-group input')?.value || 1);
        formData.append('cooking_time', document.querySelector('.time-group input')?.value || '');

        // รูปปก
        const coverFile = document.getElementById('coverImage')?.files?.[0];
        if (coverFile) formData.append('coverImage', coverFile);

        // Ingredients
        document.querySelectorAll('.ingredient-input').forEach(input => {
          const v = (input.value || '').trim();
          if (v) formData.append('ingredients', v); // ✅ backend รองรับ
        });

        // Steps + StepImages (กันรูปสลับด้วย stepImageIndex)
        const stepRows = Array.from(document.querySelectorAll('.step-item'));
        stepRows.forEach((row, idx) => {
          const text = (row.querySelector('.step-input')?.value || '').trim();
          formData.append('steps', text); // ส่งทุก step (ให้ index ตรงกัน)

          const file = row.querySelector('.step-file')?.files?.[0] || null;
          if (file) {
            const v = validateImageFile(file);
            if (!v.ok) throw new Error(`Step ${idx + 1}: ${v.msg}`);

            formData.append('stepImages', file);
            formData.append('stepImageIndex', String(idx));
          }
        });

        const res = await fetch('/api/recipes', {
          method: 'POST',
          body: formData
        });

        const result = await res.json().catch(() => ({}));

        if (res.ok) {
          alert('โพสต์สูตรอาหารสำเร็จ!');
          window.location.href = 'home.html';
        } else {
          alert('เกิดข้อผิดพลาด: ' + (result.msg || 'unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert(err?.message || 'ไม่สามารถเชื่อมต่อกับ Server ได้');
      } finally {
        postBtn.innerText = originalText;
        postBtn.disabled = false;
      }
    });
  }

  /* =========================
     5) Cancel / Delete
     ========================= */
  const delBtn = document.querySelector('.btn-delete');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (confirm('ต้องการยกเลิกและกลับไปหน้าหลักใช่หรือไม่?')) {
        window.location.href = 'home.html';
      }
    });
  }
});
