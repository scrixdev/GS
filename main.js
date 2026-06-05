// =============================================
// GARDEN STUDIO — Main JS (index.html)
// =============================================

import { db, DEMO_PROJECTS, DEMO_TESTIMONIALS, DEMO_SETTINGS } from './firebase-config.js';
import {
  collection, getDocs, addDoc, query, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =============================================
// STATE
// =============================================
let STATE = {
  projects: [],
  testimonials: [],
  settings: {},
  currentFilter: 'all',
  testiIndex: 0,
  firebaseOk: false
};

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initScrollReveal();
  initBurger();
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  try {
    await loadData();
    STATE.firebaseOk = true;
  } catch (e) {
    console.warn('Firebase non configuré, utilisation des données de démo.', e.message);
    useDemoData();
  }

  renderProjects();
  renderTestimonials();
  applySettings();
  initFilterBtns();
  initPortfolioFilters();
  animateCounters();
});

// =============================================
// DATA LOADING
// =============================================
async function loadData() {
  const [projectsSnap, testiSnap, settingsSnap] = await Promise.all([
    getDocs(query(collection(db, 'projects'), where('status', '==', 'published'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'))),
    getDocs(collection(db, 'settings'))
  ]);

  STATE.projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  STATE.testimonials = testiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (!settingsSnap.empty) {
    STATE.settings = settingsSnap.docs[0].data();
  }
}

function useDemoData() {
  STATE.projects = DEMO_PROJECTS;
  STATE.testimonials = DEMO_TESTIMONIALS;
  STATE.settings = DEMO_SETTINGS;
}

// =============================================
// NAV
// =============================================
function initNav() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // Smooth close mobile nav on link click
  document.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('nav-mobile').classList.remove('open');
    });
  });
}

function initBurger() {
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('nav-mobile');
  burger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
}

// =============================================
// SCROLL REVEAL
// =============================================
function initScrollReveal() {
  const elements = document.querySelectorAll('section, .service-card, .contact-info, .contact-form-wrap');
  elements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  elements.forEach(el => observer.observe(el));
}

// =============================================
// PORTFOLIO
// =============================================
function renderProjects() {
  const grid = document.getElementById('portfolio-grid');
  const empty = document.getElementById('portfolio-empty');
  const filter = STATE.currentFilter;

  const filtered = filter === 'all'
    ? STATE.projects
    : STATE.projects.filter(p => p.category === filter);

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = filtered.map(project => `
    <div class="portfolio-card reveal">
      ${project.image
        ? `<img class="portfolio-img" src="${escHtml(project.image)}" alt="${escHtml(project.title)}" loading="lazy" />`
        : `<div class="portfolio-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>`
      }
      <div class="portfolio-card-body">
        <div class="portfolio-category">${escHtml(project.category)}</div>
        <h3 class="portfolio-title">${escHtml(project.title)}</h3>
        <p class="portfolio-desc">${escHtml(project.description)}</p>
        ${project.techs && project.techs.length
          ? `<div class="portfolio-techs">${project.techs.map(t => `<span class="portfolio-tech">${escHtml(t)}</span>`).join('')}</div>`
          : ''
        }
        ${project.link
          ? `<a href="${escHtml(project.link)}" target="_blank" rel="noopener" class="portfolio-link">
              Voir le projet
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>`
          : ''
        }
      </div>
    </div>
  `).join('');

  // Reveal new cards
  setTimeout(() => {
    document.querySelectorAll('.portfolio-card.reveal').forEach(el => el.classList.add('visible'));
  }, 50);
}

function initFilterBtns() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.currentFilter = btn.dataset.filter;
      renderProjects();
    });
  });
}

function initPortfolioFilters() {
  // Already handled in initFilterBtns
}

// =============================================
// TESTIMONIALS SLIDER
// =============================================
function renderTestimonials() {
  const track = document.getElementById('testimonials-track');
  const dots = document.getElementById('testi-dots');

  if (!STATE.testimonials.length) {
    track.innerHTML = '<p style="color:var(--gray);text-align:center;padding:2rem">Aucun témoignage pour l\'instant.</p>';
    return;
  }

  track.innerHTML = STATE.testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testi-stars">${'★'.repeat(t.rating || 5)}</div>
      <p class="testi-text">"${escHtml(t.text)}"</p>
      <div class="testi-author">
        ${t.avatar
          ? `<img class="testi-avatar" src="${escHtml(t.avatar)}" alt="${escHtml(t.name)}" />`
          : `<div class="testi-avatar-placeholder">${(t.name || '?')[0].toUpperCase()}</div>`
        }
        <div>
          <div class="testi-name">${escHtml(t.name)}</div>
          <div class="testi-role">${escHtml(t.role || '')}</div>
        </div>
      </div>
    </div>
  `).join('');

  // Dots
  dots.innerHTML = STATE.testimonials.map((_, i) =>
    `<div class="testi-dot ${i === 0 ? 'active' : ''}" onclick="goToTesti(${i})"></div>`
  ).join('');

  // Nav buttons
  document.getElementById('testi-prev').addEventListener('click', () => {
    const prev = (STATE.testiIndex - 1 + STATE.testimonials.length) % STATE.testimonials.length;
    goToTesti(prev);
  });

  document.getElementById('testi-next').addEventListener('click', () => {
    const next = (STATE.testiIndex + 1) % STATE.testimonials.length;
    goToTesti(next);
  });

  // Auto-slide
  setInterval(() => {
    const next = (STATE.testiIndex + 1) % STATE.testimonials.length;
    goToTesti(next);
  }, 5000);
}

window.goToTesti = function(index) {
  STATE.testiIndex = index;
  const track = document.getElementById('testimonials-track');
  const cardWidth = 380 + 24; // card width + gap
  track.style.transform = `translateX(-${index * cardWidth}px)`;

  document.querySelectorAll('.testi-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
};

// =============================================
// SETTINGS
// =============================================
function applySettings() {
  const s = STATE.settings;
  if (!s) return;

  if (s.email) {
    const emailEl = document.getElementById('contact-email-display');
    const footerEmail = document.getElementById('footer-email');
    if (emailEl) { emailEl.textContent = s.email; emailEl.href = `mailto:${s.email}`; }
    if (footerEmail) { footerEmail.textContent = s.email; footerEmail.href = `mailto:${s.email}`; }
  }

  if (s.phone) {
    const phoneEl = document.getElementById('contact-phone-display');
    const footerPhone = document.getElementById('footer-phone');
    if (phoneEl) { phoneEl.textContent = s.phone; phoneEl.href = `tel:${s.phone.replace(/\s/g, '')}`; }
    if (footerPhone) { footerPhone.textContent = s.phone; footerPhone.href = `tel:${s.phone.replace(/\s/g, '')}`; }
  }

  const socials = ['twitter', 'linkedin', 'instagram', 'github'];
  socials.forEach(key => {
    if (s[key]) {
      const el = document.getElementById(`social-${key}`);
      const footerEl = document.getElementById(`footer-${key}`);
      if (el) el.href = s[key];
      if (footerEl) footerEl.href = s[key];
    }
  });

  // Stats are animated via animateCounters
  if (s.statProjects) STATE.statProjects = s.statProjects;
  if (s.statClients) STATE.statClients = s.statClients;
  if (s.statYears) STATE.statYears = s.statYears;
}

// =============================================
// COUNTER ANIMATION
// =============================================
function animateCounters() {
  const s = STATE.settings;
  const targets = {
    'stat-projects': s.statProjects || 50,
    'stat-clients': s.statClients || 35,
    'stat-years': s.statYears || 5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        Object.entries(targets).forEach(([id, target]) => {
          animateCount(document.getElementById(id), target);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const statsEl = document.querySelector('.hero-stats');
  if (statsEl) observer.observe(statsEl);
}

function animateCount(el, target) {
  if (!el) return;
  const duration = 1500;
  const start = Date.now();
  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + (target >= 10 ? '+' : '');
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// =============================================
// CONTACT FORM
// =============================================
window.submitContact = async function() {
  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const budget = document.getElementById('f-budget').value;
  const message = document.getElementById('f-message').value.trim();
  const errEl = document.getElementById('form-error');
  const btn = document.getElementById('form-submit-btn');

  errEl.classList.add('hidden');

  if (!name || !email || !message) {
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Envoi en cours…';

  const data = {
    name, email, phone, budget, message,
    createdAt: new Date().toISOString(),
    read: false
  };

  try {
    if (STATE.firebaseOk) {
      await addDoc(collection(db, 'messages'), { ...data, createdAt: serverTimestamp() });
    }
    document.getElementById('contact-form-el').classList.add('hidden');
    document.getElementById('form-success').classList.remove('hidden');
    showToast('Message envoyé !', 'Nous vous répondrons dans les 24h.');
  } catch (e) {
    console.error(e);
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Envoyer le message';
    errEl.textContent = 'Une erreur s\'est produite. Veuillez réessayer.';
    errEl.classList.remove('hidden');
  }
};

// =============================================
// TOAST
// =============================================
let toastTimer;
window.showToast = function(text, sub) {
  const t = document.getElementById('toast');
  document.getElementById('toast-text').textContent = text;
  document.getElementById('toast-sub').textContent = sub || '';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
};

// =============================================
// UTILS
// =============================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
