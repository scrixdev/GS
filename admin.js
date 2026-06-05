// =============================================
// GARDEN STUDIO — Admin JS (admin.html)
// =============================================

import { auth, db, storage, DEMO_PROJECTS, DEMO_TESTIMONIALS, DEMO_SETTINGS } from './firebase-config.js';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// =============================================
// STATE
// =============================================
let STATE = {
  projects: [],
  messages: [],
  testimonials: [],
  settings: {},
  firebaseOk: false,
  currentUser: null
};

let confirmResolver = null;

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar navigation
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      switchPanel(panel);
    });
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Auth state
  try {
    onAuthStateChanged(auth, user => {
      if (user) {
        STATE.currentUser = user;
        STATE.firebaseOk = true;
        showDashboard(user.email);
        loadAllData();
      } else {
        showLogin();
      }
    });
  } catch (e) {
    console.warn('Firebase non configuré. Mode démo admin.');
    showDemoMode();
  }
});

// =============================================
// AUTH
// =============================================
window.doLogin = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.classList.add('hidden');
  if (!email || !password) {
    errEl.textContent = 'Veuillez remplir tous les champs.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Connexion…';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the rest
  } catch (e) {
    errEl.textContent = 'Email ou mot de passe incorrect.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Se connecter';
  }
};

window.doLogout = async function() {
  try {
    await signOut(auth);
  } catch (e) {
    showLogin();
  }
};

function showLogin() {
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-dashboard').classList.add('hidden');
}

function showDashboard(email) {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').classList.remove('hidden');
  document.getElementById('admin-user-email').textContent = email || 'Admin';
  document.getElementById('admin-avatar').textContent = (email || 'A')[0].toUpperCase();
}

function showDemoMode() {
  // Show dashboard with demo data when Firebase not configured
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').classList.remove('hidden');
  document.getElementById('admin-user-email').textContent = 'Mode démo';

  STATE.projects = DEMO_PROJECTS;
  STATE.testimonials = DEMO_TESTIMONIALS;
  STATE.settings = DEMO_SETTINGS;

  renderProjects();
  renderMessages();
  renderTestimonials();
  loadSettings();

  showToast('Mode démo', 'Configurez Firebase pour activer toutes les fonctionnalités.');
}

// =============================================
// DATA LOADING
// =============================================
async function loadAllData() {
  try {
    await Promise.all([loadProjects(), loadMessages(), loadTestimonials(), loadSettings()]);
  } catch (e) {
    console.error('Erreur chargement données:', e);
    showToast('Erreur', 'Impossible de charger les données.');
  }
}

async function loadProjects() {
  const snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
  STATE.projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProjects();
}

async function loadMessages() {
  const snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')));
  STATE.messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderMessages();
  updateMessagesBadge();
}

async function loadTestimonials() {
  const snap = await getDocs(query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')));
  STATE.testimonials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTestimonials();
}

async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'main'));
    if (snap.exists()) {
      STATE.settings = snap.data();
    }
  } catch (e) {
    STATE.settings = DEMO_SETTINGS;
  }
  fillSettingsForm();
}

// =============================================
// PANELS
// =============================================
function switchPanel(panelName) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));

  document.getElementById(`panel-${panelName}`).classList.add('active');
  document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');
  document.getElementById('topbar-title').textContent = {
    projects: 'Projets',
    messages: 'Messages',
    testimonials: 'Témoignages',
    settings: 'Paramètres'
  }[panelName] || panelName;
}

// =============================================
// PROJECTS
// =============================================
function renderProjects() {
  const list = document.getElementById('projects-list');
  const count = document.getElementById('projects-count');
  count.textContent = `${STATE.projects.length} projet(s)`;

  if (!STATE.projects.length) {
    list.innerHTML = '<div class="empty-state">Aucun projet. Ajoutez votre premier projet.</div>';
    return;
  }

  list.innerHTML = STATE.projects.map(p => `
    <div class="project-row">
      ${p.image
        ? `<img class="project-row-img" src="${escHtml(p.image)}" alt="${escHtml(p.title)}" />`
        : `<div class="project-row-img-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>`
      }
      <div class="project-row-info">
        <div class="project-row-title">${escHtml(p.title)}</div>
        <div class="project-row-meta">
          <span class="project-row-category">${escHtml(p.category || '')}</span>
          <span class="status-badge ${p.status || 'draft'}">${p.status === 'published' ? 'Publié' : 'Brouillon'}</span>
        </div>
      </div>
      <div class="project-row-actions">
        <button class="btn-toggle" onclick="toggleProjectStatus('${p.id}', '${p.status}')">
          ${p.status === 'published' ? 'Dépublier' : 'Publier'}
        </button>
        <button class="btn-edit" onclick="openProjectModal('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Modifier
        </button>
        <button class="btn-delete" onclick="deleteProject('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Supprimer
        </button>
      </div>
    </div>
  `).join('');
}

window.openProjectModal = function(id = null) {
  const modal = document.getElementById('project-modal');
  const titleEl = document.getElementById('modal-project-title');

  // Reset form
  document.getElementById('project-id').value = '';
  document.getElementById('p-title').value = '';
  document.getElementById('p-desc').value = '';
  document.getElementById('p-category').value = '';
  document.getElementById('p-status').value = 'published';
  document.getElementById('p-techs').value = '';
  document.getElementById('p-link').value = '';
  document.getElementById('p-image').value = '';
  document.getElementById('p-image-preview-wrap').classList.add('hidden');

  if (id) {
    const project = STATE.projects.find(p => p.id === id);
    if (project) {
      titleEl.textContent = 'Modifier le projet';
      document.getElementById('project-id').value = id;
      document.getElementById('p-title').value = project.title || '';
      document.getElementById('p-desc').value = project.description || '';
      document.getElementById('p-category').value = project.category || '';
      document.getElementById('p-status').value = project.status || 'published';
      document.getElementById('p-techs').value = (project.techs || []).join(', ');
      document.getElementById('p-link').value = project.link || '';
      document.getElementById('p-image').value = project.image || '';
      if (project.image) {
        document.getElementById('p-image-preview').src = project.image;
        document.getElementById('p-image-preview-wrap').classList.remove('hidden');
      }
    }
  } else {
    titleEl.textContent = 'Nouveau projet';
  }

  modal.classList.add('open');
};

window.closeProjectModal = function() {
  document.getElementById('project-modal').classList.remove('open');
};

window.saveProject = async function() {
  const id = document.getElementById('project-id').value;
  const title = document.getElementById('p-title').value.trim();
  const description = document.getElementById('p-desc').value.trim();
  const category = document.getElementById('p-category').value;
  const status = document.getElementById('p-status').value;
  const techsRaw = document.getElementById('p-techs').value;
  const link = document.getElementById('p-link').value.trim();
  const image = document.getElementById('p-image').value.trim();

  if (!title || !description || !category) {
    showToast('Erreur', 'Titre, description et catégorie sont obligatoires.');
    return;
  }

  const techs = techsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const data = { title, description, category, status, techs, link, image };

  if (!STATE.firebaseOk) {
    if (id) {
      const idx = STATE.projects.findIndex(p => p.id === id);
      if (idx !== -1) STATE.projects[idx] = { id, ...data };
    } else {
      STATE.projects.unshift({ id: `demo-${Date.now()}`, ...data });
    }
    renderProjects();
    closeProjectModal();
    showToast('Projet sauvegardé', '(Mode démo - non persisté)');
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, 'projects', id), { ...data, updatedAt: serverTimestamp() });
      showToast('Projet modifié', 'Les changements ont été enregistrés.');
    } else {
      await addDoc(collection(db, 'projects'), { ...data, createdAt: serverTimestamp() });
      showToast('Projet ajouté', 'Le projet est maintenant en ligne.');
    }
    await loadProjects();
    closeProjectModal();
  } catch (e) {
    console.error(e);
    showToast('Erreur', 'Impossible d\'enregistrer le projet.');
  }
};

window.deleteProject = async function(id) {
  const ok = await askConfirm('Supprimer ce projet ? Cette action est irréversible.');
  if (!ok) return;

  if (!STATE.firebaseOk) {
    STATE.projects = STATE.projects.filter(p => p.id !== id);
    renderProjects();
    showToast('Projet supprimé', '');
    return;
  }

  try {
    await deleteDoc(doc(db, 'projects', id));
    await loadProjects();
    showToast('Projet supprimé', '');
  } catch (e) {
    showToast('Erreur', 'Impossible de supprimer le projet.');
  }
};

window.toggleProjectStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';

  if (!STATE.firebaseOk) {
    const idx = STATE.projects.findIndex(p => p.id === id);
    if (idx !== -1) STATE.projects[idx].status = newStatus;
    renderProjects();
    return;
  }

  try {
    await updateDoc(doc(db, 'projects', id), { status: newStatus, updatedAt: serverTimestamp() });
    await loadProjects();
    showToast(newStatus === 'published' ? 'Projet publié' : 'Projet dépublié', '');
  } catch (e) {
    showToast('Erreur', 'Impossible de changer le statut.');
  }
};

window.handleProjectImageUpload = async function() {
  const file = document.getElementById('p-image-file').files[0];
  if (!file) return;

  if (!STATE.firebaseOk) {
    showToast('Info', 'Upload disponible une fois Firebase configuré.');
    return;
  }

  try {
    const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    document.getElementById('p-image').value = url;
    document.getElementById('p-image-preview').src = url;
    document.getElementById('p-image-preview-wrap').classList.remove('hidden');
    showToast('Image uploadée', 'L\'image a été enregistrée.');
  } catch (e) {
    showToast('Erreur', 'Impossible d\'uploader l\'image.');
  }
};

// =============================================
// MESSAGES
// =============================================
function renderMessages() {
  const list = document.getElementById('messages-list');
  const count = document.getElementById('messages-count');
  count.textContent = `${STATE.messages.length} message(s)`;

  if (!STATE.messages.length) {
    list.innerHTML = '<div class="empty-state">Aucun message reçu pour l\'instant.</div>';
    return;
  }

  list.innerHTML = STATE.messages.map(m => {
    const date = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('fr-FR') : (m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR') : '—');
    return `
    <div class="message-card ${m.read ? '' : 'unread'}">
      <div class="message-header">
        <div class="message-from">${escHtml(m.name)}</div>
        <div class="message-date">${date}</div>
      </div>
      <div class="message-meta">
        <span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          ${escHtml(m.email)}
        </span>
        ${m.phone ? `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${escHtml(m.phone)}</span>` : ''}
        ${m.budget ? `<span>Budget: ${escHtml(m.budget)}</span>` : ''}
      </div>
      <div class="message-text">${escHtml(m.message)}</div>
      <div class="message-actions">
        <a href="mailto:${escHtml(m.email)}" class="btn-edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Répondre
        </a>
        ${!m.read && STATE.firebaseOk ? `<button class="btn-toggle" onclick="markMessageRead('${m.id}')">Marquer lu</button>` : ''}
        <button class="btn-delete" onclick="deleteMessage('${m.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          Supprimer
        </button>
      </div>
    </div>
  `}).join('');
}

function updateMessagesBadge() {
  const unread = STATE.messages.filter(m => !m.read).length;
  const badge = document.getElementById('messages-badge');
  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

window.markMessageRead = async function(id) {
  if (!STATE.firebaseOk) return;
  try {
    await updateDoc(doc(db, 'messages', id), { read: true });
    await loadMessages();
  } catch (e) { console.error(e); }
};

window.deleteMessage = async function(id) {
  const ok = await askConfirm('Supprimer ce message définitivement ?');
  if (!ok) return;

  if (!STATE.firebaseOk) {
    STATE.messages = STATE.messages.filter(m => m.id !== id);
    renderMessages();
    return;
  }

  try {
    await deleteDoc(doc(db, 'messages', id));
    await loadMessages();
    showToast('Message supprimé', '');
  } catch (e) {
    showToast('Erreur', 'Impossible de supprimer le message.');
  }
};

// =============================================
// TESTIMONIALS
// =============================================
function renderTestimonials() {
  const list = document.getElementById('testi-list');
  const count = document.getElementById('testi-count');
  count.textContent = `${STATE.testimonials.length} témoignage(s)`;

  if (!STATE.testimonials.length) {
    list.innerHTML = '<div class="empty-state">Aucun témoignage pour l\'instant.</div>';
    return;
  }

  list.innerHTML = STATE.testimonials.map(t => `
    <div class="testi-admin-card">
      <div class="testi-admin-header">
        <div>
          <div class="testi-admin-name">${escHtml(t.name)}</div>
          <div class="testi-admin-role">${escHtml(t.role || '')}</div>
        </div>
        <span style="color:var(--accent)">${'★'.repeat(t.rating || 5)}</span>
      </div>
      <p class="testi-admin-text">"${escHtml(t.text)}"</p>
      <div class="testi-admin-actions">
        <button class="btn-edit" onclick="openTestiModal('${t.id}')">Modifier</button>
        <button class="btn-delete" onclick="deleteTestimonial('${t.id}')">Supprimer</button>
      </div>
    </div>
  `).join('');
}

window.openTestiModal = function(id = null) {
  const modal = document.getElementById('testi-modal');
  document.getElementById('testi-id').value = '';
  document.getElementById('t-name').value = '';
  document.getElementById('t-role').value = '';
  document.getElementById('t-rating').value = '5';
  document.getElementById('t-text').value = '';
  document.getElementById('t-avatar').value = '';
  document.getElementById('modal-testi-title').textContent = 'Nouveau témoignage';

  if (id) {
    const t = STATE.testimonials.find(x => x.id === id);
    if (t) {
      document.getElementById('modal-testi-title').textContent = 'Modifier le témoignage';
      document.getElementById('testi-id').value = id;
      document.getElementById('t-name').value = t.name || '';
      document.getElementById('t-role').value = t.role || '';
      document.getElementById('t-rating').value = t.rating || 5;
      document.getElementById('t-text').value = t.text || '';
      document.getElementById('t-avatar').value = t.avatar || '';
    }
  }

  modal.classList.add('open');
};

window.closeTestiModal = function() {
  document.getElementById('testi-modal').classList.remove('open');
};

window.saveTestimonial = async function() {
  const id = document.getElementById('testi-id').value;
  const name = document.getElementById('t-name').value.trim();
  const role = document.getElementById('t-role').value.trim();
  const rating = parseInt(document.getElementById('t-rating').value);
  const text = document.getElementById('t-text').value.trim();
  const avatar = document.getElementById('t-avatar').value.trim();

  if (!name || !text) {
    showToast('Erreur', 'Nom et témoignage sont obligatoires.');
    return;
  }

  const data = { name, role, rating, text, avatar };

  if (!STATE.firebaseOk) {
    if (id) {
      const idx = STATE.testimonials.findIndex(t => t.id === id);
      if (idx !== -1) STATE.testimonials[idx] = { id, ...data };
    } else {
      STATE.testimonials.unshift({ id: `demo-t-${Date.now()}`, ...data });
    }
    renderTestimonials();
    closeTestiModal();
    showToast('Témoignage sauvegardé', '(Mode démo)');
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, 'testimonials', id), { ...data, updatedAt: serverTimestamp() });
      showToast('Témoignage modifié', '');
    } else {
      await addDoc(collection(db, 'testimonials'), { ...data, createdAt: serverTimestamp() });
      showToast('Témoignage ajouté', '');
    }
    await loadTestimonials();
    closeTestiModal();
  } catch (e) {
    showToast('Erreur', 'Impossible d\'enregistrer le témoignage.');
  }
};

window.deleteTestimonial = async function(id) {
  const ok = await askConfirm('Supprimer ce témoignage ?');
  if (!ok) return;

  if (!STATE.firebaseOk) {
    STATE.testimonials = STATE.testimonials.filter(t => t.id !== id);
    renderTestimonials();
    showToast('Témoignage supprimé', '');
    return;
  }

  try {
    await deleteDoc(doc(db, 'testimonials', id));
    await loadTestimonials();
    showToast('Témoignage supprimé', '');
  } catch (e) {
    showToast('Erreur', '');
  }
};

// =============================================
// SETTINGS
// =============================================
function fillSettingsForm() {
  const s = STATE.settings;
  if (!s) return;
  const fields = ['email', 'phone', 'twitter', 'linkedin', 'instagram', 'github'];
  fields.forEach(f => {
    const el = document.getElementById(`set-${f}`);
    if (el && s[f]) el.value = s[f];
  });
  if (s.statProjects) document.getElementById('set-stat-projects').value = s.statProjects;
  if (s.statClients) document.getElementById('set-stat-clients').value = s.statClients;
  if (s.statYears) document.getElementById('set-stat-years').value = s.statYears;
}

window.saveSettings = async function() {
  const data = {
    email: document.getElementById('set-email').value.trim(),
    phone: document.getElementById('set-phone').value.trim(),
    twitter: document.getElementById('set-twitter').value.trim(),
    linkedin: document.getElementById('set-linkedin').value.trim(),
    instagram: document.getElementById('set-instagram').value.trim(),
    github: document.getElementById('set-github').value.trim(),
    statProjects: parseInt(document.getElementById('set-stat-projects').value) || 50,
    statClients: parseInt(document.getElementById('set-stat-clients').value) || 35,
    statYears: parseInt(document.getElementById('set-stat-years').value) || 5,
    updatedAt: new Date().toISOString()
  };

  if (!STATE.firebaseOk) {
    STATE.settings = data;
    showToast('Paramètres sauvegardés', '(Mode démo - non persisté)');
    return;
  }

  try {
    await setDoc(doc(db, 'settings', 'main'), data);
    STATE.settings = data;
    showToast('Paramètres enregistrés', 'Les changements sont en ligne.');
  } catch (e) {
    showToast('Erreur', 'Impossible d\'enregistrer les paramètres.');
  }
};

// =============================================
// CONFIRM MODAL
// =============================================
async function askConfirm(message) {
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-message').textContent = message;
  modal.classList.add('open');
  return new Promise(resolve => { confirmResolver = resolve; });
}

window.resolveConfirm = function(value) {
  const resolve = confirmResolver;
  confirmResolver = null;
  document.getElementById('confirm-modal').classList.remove('open');
  if (resolve) resolve(Boolean(value));
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
