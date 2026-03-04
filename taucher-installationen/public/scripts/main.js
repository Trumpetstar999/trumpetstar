// Navigation Scroll Effect
const nav = document.querySelector('.site-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
}

// Hero Slideshow
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelectorAll('.hero-dot');
const prevBtn = document.querySelector('.hero-prev');
const nextBtn = document.querySelector('.hero-next');
let currentSlide = 0;

function showSlide(index) {
  heroSlides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  heroDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
  currentSlide = index;
}

if (heroSlides.length > 1) {
  // Auto-advance
  setInterval(() => {
    const next = (currentSlide + 1) % heroSlides.length;
    showSlide(next);
  }, 5000);

  // Manual controls
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const prev = (currentSlide - 1 + heroSlides.length) % heroSlides.length;
      showSlide(prev);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const next = (currentSlide + 1) % heroSlides.length;
      showSlide(next);
    });
  }
  heroDots.forEach((dot, i) => {
    dot.addEventListener('click', () => showSlide(i));
  });
}

// Intersection Observer for Animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('anim-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.anim-ready').forEach(el => {
  observer.observe(el);
});

// Cookie Banner
const cookieBanner = document.getElementById('cookie-banner');
const cookieAccept = document.getElementById('cookie-accept');

if (cookieBanner && !localStorage.getItem('cookiesAccepted')) {
  cookieBanner.style.display = 'block';
}

if (cookieAccept) {
  cookieAccept.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'true');
    cookieBanner.style.display = 'none';
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
