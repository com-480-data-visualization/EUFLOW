// make navigation bar remain visible when background is white or light color
window.addEventListener('scroll', () => {
    // navigation bar
    const navbar = document.getElementById('navbar');
    const logo = document.getElementById('nav-logo');
    
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


document.addEventListener("DOMContentLoaded", function () {

    function animateCounter(element, target, duration = 1500) {
        const suffix = element.dataset.suffix || "";
        let start = null;

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            element.textContent = current.toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.dataset.target);
                if (target > 0) animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll(".stat-value, .stat-value-sm").forEach(el => {
        counterObserver.observe(el);
    });

});