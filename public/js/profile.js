document.addEventListener('DOMContentLoaded', () => {
    
    // จัดการ Tab Switching
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 1. ลบ Active ออกจากทุกปุ่ม
            tabs.forEach(t => t.classList.remove('active'));
            
            // 2. ใส่ Active ให้ปุ่มที่กด
            tab.classList.add('active');

            // 3. ซ่อนทุก Content
            contents.forEach(c => c.classList.add('hidden'));

            // 4. โชว์ Content ที่ตรงกับ data-target
            const targetId = tab.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            
            targetContent.classList.remove('hidden');

            // Animation เล็กน้อยตอนเปลี่ยน Tab
            anime({
                targets: targetContent,
                opacity: [0, 1],
                translateY: [10, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });

});