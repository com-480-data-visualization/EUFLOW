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