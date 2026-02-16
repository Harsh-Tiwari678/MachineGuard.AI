//animation ko handle karne ke liye ye file hai, isme particles.js aur AOS animations ke liye code hai
if (document.getElementById('particles-js')) {
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#6366f1' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#6366f1',
                opacity: 0.4,
                width: 1
            },
            move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
            modes: { grab: { distance: 400, line_linked: { opacity: 1 } }, bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 }, repulse: { distance: 200, duration: 0.4 }, push: { particles_nb: 4 }, remove: { particles_nb: 2 } }
        },
        retina_detect: true
    });
}


function animateCounters() {
    const counters = document.querySelectorAll('[data-target]');

    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const increment = target / 50;

        const updateCount = () => {
            const count = +counter.innerText;
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCount, 30);
            } else {
                counter.innerText = target;
            }
        };

        updateCount();
    });
}


const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
});

document.querySelectorAll('.hero-stats').forEach(el => observer.observe(el));


if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
}

const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('active');
    });
}