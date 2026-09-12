document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsHover = window.matchMedia('(hover: hover)').matches;

  /* ---------- Header state + scroll progress ---------- */

  let ticking = false;

  function updateOnScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (header) {
      header.classList.toggle('is-scrolled', scrollTop > 8);
    }

    if (progressBar) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }

    ticking = false;
  }

  document.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  }, { passive: true });

  updateOnScroll();

  /* ---------- Smooth scroll for in-page nav links ---------- */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId.length < 2) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      const headerHeight = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 1;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  /* ---------- Reveal-on-scroll for About / Projects / Contact ---------- */

  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  if (revealEls.length) {
    // Stagger elements that share the same parent container.
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    groups.forEach((items) => {
      items.forEach((el, index) => {
        el.style.transitionDelay = prefersReducedMotion ? '0ms' : `${index * 90}ms`;
      });
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ---------- Hero cursor spotlight ---------- */

  const hero = document.querySelector('.hero');
  const spotlight = document.querySelector('.hero-spotlight');

  if (hero && spotlight && supportsHover && !prefersReducedMotion) {
    hero.addEventListener('mousemove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      spotlight.style.setProperty('--mx', `${x}%`);
      spotlight.style.setProperty('--my', `${y}%`);
    });
  }

  /* ---------- Project card cursor glow ---------- */

  if (supportsHover && !prefersReducedMotion) {
    document.querySelectorAll('.project-card').forEach((card) => {
      const glow = card.querySelector('.card-glow');
      if (!glow) return;

      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        glow.style.setProperty('--mx', `${x}%`);
        glow.style.setProperty('--my', `${y}%`);
      });
    });
  }
});
