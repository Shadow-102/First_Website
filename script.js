document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsHover = window.matchMedia('(hover: hover)').matches;

  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const heroImage = document.getElementById('heroImage');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     Header state, scroll progress, and hero parallax
     Combined into a single rAF-throttled scroll handler for performance.
  --------------------------------------------------------------------- */

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

    if (heroImage && !prefersReducedMotion) {
      heroImage.style.transform = `translate3d(0, ${scrollTop * 0.12}px, 0)`;
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

  /* ---------------------------------------------------------------------
     Smooth scroll for in-page nav links
  --------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------
     Reveal-on-scroll for About / Skills / Projects / Contact
  --------------------------------------------------------------------- */

  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  if (revealEls.length) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    groups.forEach((items) => {
      items.forEach((el, index) => {
        el.style.transitionDelay = prefersReducedMotion ? '0ms' : `${index * 80}ms`;
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

  /* ---------------------------------------------------------------------
     Cursor-follow glow for project cards and glow buttons
  --------------------------------------------------------------------- */

  function attachGlow(el) {
    el.addEventListener('mousemove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    });
  }

  if (supportsHover && !prefersReducedMotion) {
    document.querySelectorAll('.project-card').forEach(attachGlow);
    document.querySelectorAll('.btn-glow').forEach(attachGlow);
  }

  /* ---------------------------------------------------------------------
     Hero role text — scramble/decode effect
     Cycles through role labels with a matrix-style character reveal.
     Falls back to a static label when reduced motion is requested.
  --------------------------------------------------------------------- */

  const roles = ['SSPŠ Student', 'HOI4 Modder', 'Tech Enthusiast'];
  const roleTextEl = document.getElementById('roleText');

  if (roleTextEl) {
    if (prefersReducedMotion) {
      roleTextEl.textContent = roles[0];
    } else {
      const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#';

      class TextScramble {
        constructor(el) {
          this.el = el;
          this.frame = 0;
          this.frameRequest = null;
          this.queue = [];
          this.resolve = null;
          this.update = this.update.bind(this);
        }

        setText(newText) {
          const oldText = this.el.textContent || '';
          const length = Math.max(oldText.length, newText.length);

          this.queue = [];
          for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 20);
            const end = start + Math.floor(Math.random() * 20);
            this.queue.push({ from, to, start, end, char: '' });
          }

          cancelAnimationFrame(this.frameRequest);
          this.frame = 0;

          return new Promise((resolve) => {
            this.resolve = resolve;
            this.update();
          });
        }

        update() {
          let output = '';
          let complete = 0;

          for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];

            if (this.frame >= item.end) {
              complete++;
              output += item.to;
            } else if (this.frame >= item.start) {
              if (!item.char || Math.random() < 0.28) {
                item.char = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
              }
              output += `<span class="scramble-char">${item.char}</span>`;
            } else {
              output += item.from;
            }
          }

          this.el.innerHTML = output;

          if (complete === this.queue.length) {
            this.resolve();
          } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
          }
        }
      }

      const scrambler = new TextScramble(roleTextEl);
      let roleIndex = 0;

      const cycleRoles = () => {
        scrambler.setText(roles[roleIndex]).then(() => {
          setTimeout(() => {
            roleIndex = (roleIndex + 1) % roles.length;
            cycleRoles();
          }, 1900);
        });
      };

      cycleRoles();
    }
  }

  /* ---------------------------------------------------------------------
     Skill badges — tap-to-reveal on touch devices
     (:hover / :focus-visible already handle mouse and keyboard.)
  --------------------------------------------------------------------- */

  document.querySelectorAll('.skill-badge').forEach((badge) => {
    badge.addEventListener('click', () => {
      badge.classList.toggle('is-active');
    });
  });

  /* ---------------------------------------------------------------------
     Project detail modal
  --------------------------------------------------------------------- */

  const projectDetails = {
    hoi4: {
      title: 'Hearts of Iron IV — Mod Development',
      tagline: 'Modding the Paradox grand-strategy engine.',
      features: [
        'Custom focus trees with branching national paths and unique decisions',
        'Scripted historical and hypothetical events with multiple outcomes',
        'Custom graphics — focus icons, event images, and leader portraits',
        'Playtesting and balancing changes across game patches'
      ],
      tags: ['Paradox Script', 'Game Design', 'Digital Art']
    },
    pc: {
      title: 'Custom PC Building & Server Administration',
      tagline: 'From picking parts to keeping a home server alive.',
      features: [
        'Component research and compatibility planning for full custom builds',
        'Hands-on assembly, cable management, and thermal tuning',
        'Setting up and maintaining a small home server',
        'Basic Linux administration, backups, and network troubleshooting'
      ],
      tags: ['Hardware', 'Linux', 'Networking']
    }
  };

  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalTagline = document.getElementById('modalTagline');
  const modalFeatures = document.getElementById('modalFeatures');
  const modalTags = document.getElementById('modalTags');

  let lastFocusedEl = null;

  function getFocusable() {
    return modalOverlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }

  function onModalKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function openModal(key) {
    const data = projectDetails[key];
    if (!data || !modalOverlay) return;

    modalTitle.textContent = data.title;
    modalTagline.textContent = data.tagline;
    modalFeatures.innerHTML = data.features.map((f) => `<li>${f}</li>`).join('');
    modalTags.innerHTML = data.tags.map((t) => `<li>${t}</li>`).join('');

    lastFocusedEl = document.activeElement;
    modalOverlay.classList.add('is-open');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onModalKeydown);
    modalClose.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onModalKeydown);
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.querySelectorAll('[data-project]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.project));
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) closeModal();
    });
  }
});
