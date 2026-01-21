// Good Practice: เลือก Element ครั้งเดียว
const heroTitle = document.querySelector('.hero-title');

function animateIntro() {
    anime({
        targets: heroTitle,
        translateY: [50, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 1200,
        delay: 500
    });
}