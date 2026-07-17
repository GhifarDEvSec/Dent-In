/* ==========================================================================
   Dent-in — unified frontend. Every action calls the real REST API.
   ========================================================================== */

/* ============================= 1. API CLIENT ============================= */
const DentinAPI = (() => {
  const listeners = [];
  const logStore = [];
  function pushLog(method, path, ok, message) {
    logStore.unshift({ method, path, ok, message, at: new Date().toISOString() });
    if (logStore.length > 60) logStore.pop();
    listeners.forEach(fn => fn());
  }

  async function call(method, path, { json, form } = {}) {
    const opts = { method, headers: {} };
    const token = localStorage.getItem('dx_token');
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (json !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(json); }
    if (form !== undefined) { opts.body = form; }
    let resp, body;
    try {
      resp = await fetch(path, opts);
      body = await resp.json();
    } catch (e) {
      body = { success: false, message: 'Network error: ' + e.message, data: null };
    }
    pushLog(method, path, !!body.success, body.message || (resp && resp.statusText) || '');
    return body;
  }

  const SESSION = 'dx_patient_id';
  const TOKEN_KEY = 'dx_token';
  const ROLE_KEY = 'dx_role';

  const register = req => call('POST', '/api/auth/register', { json: req });
  const login = (identifier, password) => call('POST', '/api/auth/login', { json: { identifier, password } });
  const setSession = (id, token, role) => { localStorage.setItem(SESSION, String(id)); if (token) localStorage.setItem(TOKEN_KEY, token); if (role) localStorage.setItem(ROLE_KEY, role); };
  const clearSession = () => { localStorage.removeItem(SESSION); localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(ROLE_KEY); };
  const sessionId = () => localStorage.getItem(SESSION);
  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const isAdmin = () => localStorage.getItem(ROLE_KEY) === 'ADMIN';

  async function currentPatient() {
    const id = sessionId();
    if (!id) return null;
    const r = await call('GET', '/api/patients/' + id);
    if (!r.success) { clearSession(); return null; }
    return r.data;
  }

  /* OTP */
  const sendOtp = (email, purpose) => call('POST', '/api/otp/send', { json: { email, purpose } });
  const verifyOtp = (email, code, purpose) => call('POST', '/api/otp/verify', { json: { email, code, purpose } });

  /* Dentists */
  const getDentists = () => call('GET', '/api/dentists');

  /* Appointments */
  const createAppointment = req => call('POST', '/api/appointments', { json: req });
  const getAppointmentsByPatient = pid => call('GET', '/api/appointments/patient/' + pid);
  const cancelAppointment = id => call('PATCH', '/api/appointments/' + id + '/cancel');

  /* Teeth scans */
  async function uploadScan(patientId, file) {
    const fd = new FormData();
    fd.append('patientId', patientId);
    fd.append('file', file, file.name || 'scan.jpg');
    return call('POST', '/api/scans/upload', { form: fd });
  }
  const analyzeScan = id => call('POST', '/api/scans/' + id + '/analyze');
  const getScansByPatient = pid => call('GET', '/api/scans/patient/' + pid);

  /* Prescriptions */
  const createPrescription = req => call('POST', '/api/prescriptions', { json: req });
  const getPrescriptionsByPatient = pid => call('GET', '/api/prescriptions/patient/' + pid);

  /* Notifications */
  const getNotifications = pid => call('GET', '/api/notifications/patient/' + pid);
  const getUnreadCount = pid => call('GET', '/api/notifications/patient/' + pid + '/count');
  const markNotifRead = id => call('PATCH', '/api/notifications/' + id + '/read');
  const markAllRead = pid => call('PATCH', '/api/notifications/patient/' + pid + '/read-all');

  /* Maps */
  const getMapKey = () => call('GET', '/api/maps/api-key');
  const getMapLocations = () => call('GET', '/api/maps/locations');
  const getNearby = (lat, lng, r) => call('GET', '/api/maps/nearby?lat=' + lat + '&lng=' + lng + '&radiusKm=' + (r || 25));

  /* Admin - Dentist management */
  const createDentist = req => call('POST', '/api/dentists', { json: req });
  const updateDentist = (id, req) => call('PUT', '/api/dentists/' + id, { json: req });
  const deleteDentist = id => call('DELETE', '/api/dentists/' + id);

  /* Admin - read-all endpoints */
  const getPatients = () => call('GET', '/api/patients');
  const getAllAppointments = () => call('GET', '/api/appointments');
  const getAllScans = () => call('GET', '/api/scans');
  const getAllPrescriptions = () => call('GET', '/api/prescriptions');

  /* Admin - update/delete */
  const updateAppointmentStatus = (id, status) => call('PATCH', '/api/appointments/' + id + '/status?status=' + status);
  const deletePatient = id => call('DELETE', '/api/patients/' + id);
  const deleteAppointment = id => call('DELETE', '/api/appointments/' + id);
  const deleteScan = id => call('DELETE', '/api/scans/' + id);
  const deletePrescription = id => call('DELETE', '/api/prescriptions/' + id);
  const setDentistActive = (id, active) => call('PATCH', '/api/dentists/' + id + '/active?active=' + active);

  /* Cached lookups */
  let _patientsCache = null;
  let _dentistsCache = null;

  async function findPatient(id) {
    if (_patientsCache) {
      const found = _patientsCache.find(p => p.id === Number(id));
      if (found) return found;
    }
    const res = await getPatients();
    _patientsCache = res.success ? res.data : [];
    return _patientsCache.find(p => p.id === Number(id)) || null;
  }

  async function findDentist(id) {
    if (_dentistsCache) {
      const found = _dentistsCache.find(d => d.id === Number(id));
      if (found) return found;
    }
    const res = await getDentists();
    _dentistsCache = res.success ? res.data : [];
    return _dentistsCache.find(d => d.id === Number(id)) || null;
  }

  function clearCaches() { _patientsCache = null; _dentistsCache = null; }

  return {
    register, login, setSession, clearSession, sessionId, getToken, currentPatient, isAdmin,
    sendOtp, verifyOtp,
    getDentists, createAppointment, getAppointmentsByPatient, cancelAppointment,
    uploadScan, analyzeScan, getScansByPatient,
    createPrescription, getPrescriptionsByPatient,
    getNotifications, getUnreadCount, markNotifRead, markAllRead,
    getMapKey, getMapLocations, getNearby,
    createDentist, updateDentist, deleteDentist,
    getPatients, getAllAppointments, getAllScans, getAllPrescriptions,
    updateAppointmentStatus, deletePatient, deleteAppointment, deleteScan, deletePrescription,
    setDentistActive, findPatient, findDentist, clearCaches,
    onLog: fn => listeners.push(fn), getLog: () => logStore,
    clearLog: () => { logStore.length = 0; listeners.forEach(fn => fn()); },
  };
})();

/* ============================= 2. HELPERS =============================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const initials = p => !p ? '' : (p.fullName || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const shortTime = t => (t || '').slice(0, 5);

function toast(msg, kind) {
  let wrap = $('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function fmtApptDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function isToday(dateStr) { return dateStr === new Date().toISOString().slice(0, 10); }

function parseAnalysis(scan) {
  if (!scan || !scan.aiAnalysisResult) return null;
  try { return typeof scan.aiAnalysisResult === 'object' ? scan.aiAnalysisResult : JSON.parse(scan.aiAnalysisResult); } catch { return null; }
}

let _dentistDisplayCache = {};
async function dentistDisplay(id) {
  if (_dentistDisplayCache[id]) return _dentistDisplayCache[id];
  const d = await DentinAPI.findDentist(id);
  _dentistDisplayCache[id] = d || {};
  return _dentistDisplayCache[id];
}

/* =============================== 3. ROUTER ============================== */
const routes = ['home', 'find', 'login', 'register', 'about', 'admin'];
let pendingLoginRole = null;

async function route() {
  const hash = (location.hash || '#/home').replace('#/', '') || 'home';
  const name = routes.includes(hash) ? hash : 'home';

  if (name === 'admin' && !DentinAPI.isAdmin()) {
    pendingLoginRole = 'professional';
    location.hash = '#/login';
    return;
  }

  const adminIn = DentinAPI.isAdmin();
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  $$('.nav-links a').forEach(a => a.classList.toggle('current', a.dataset.route === name));
  const pl = $('#patientNavLinks');
  if (pl) pl.style.display = (name === 'admin' || adminIn) ? 'none' : '';
  window.scrollTo({ top: 0 });
  await renderNav();
  if (name === 'find') await renderFindDoctor();
  if (name === 'home') await renderDashboard();
  if (name === 'admin') await renderAdmin();
  if (name === 'login') { applyLoginRoleUI(pendingLoginRole || 'patient'); pendingLoginRole = null; }
}
window.addEventListener('hashchange', route);

function goDashboard() {
  location.hash = '#/home';
  route();
  setTimeout(() => { const el = document.getElementById('dashboard'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60);
}

/* =============================== 4. TOP NAV ============================= */
async function renderNav() {
  const slot = $('[data-auth-slot]');
  if (!slot) return;
  const p = await DentinAPI.currentPatient();
  if (DentinAPI.isAdmin()) {
    slot.innerHTML =
      '<a href="#/admin" class="btn btn-outline">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2F80ED" stroke-width="2.2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>' +
        ' Clinic Admin</a>' +
      '<button type="button" class="btn btn-ghost" id="navLogoutBtn">Log out</button>';
    $('#navLogoutBtn').onclick = () => { DentinAPI.clearSession(); DentinAPI.clearCaches(); toast('Logged out'); location.hash = '#/home'; route(); };
  } else if (p) {
    slot.innerHTML =
      '<div class="nav-user"><div class="nav-user-pfp">' + initials(p) + '</div><span>' + p.fullName.split(' ')[0] + '</span></div>' +
      '<button type="button" class="btn btn-ghost" id="navLogoutBtn">Log out</button>';
    $('#navLogoutBtn').onclick = () => { DentinAPI.clearSession(); DentinAPI.clearCaches(); toast('Logged out'); location.hash = '#/home'; route(); };
  } else {
    slot.innerHTML =
      '<a href="#/login" class="btn btn-ghost">Log in</a>' +
      '<a href="#/register" class="btn btn-primary">Get started</a>';
  }
}

/* ============================ 5. FIND A DOCTOR ========================== */
let DENTIST_CACHE = [];
let mapInstance = null;

async function renderFindDoctor() {
  const r = await DentinAPI.getDentists();
  const list = (r.success ? r.data : []).filter(d => d.active !== false);
  DENTIST_CACHE = list;
  _dentistDisplayCache = {};
  list.forEach(d => { _dentistDisplayCache[d.id] = d; });

  const star = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#F2C94C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const card = d =>
    '<div class="doc-card" data-doc-id="' + d.id + '">' +
      '<div class="doc-top">' +
        '<div class="doc-pfp" style="background:linear-gradient(135deg,#' + (d.colorHex || d.color || '2F80ED') + ',#1B63C7);">' + (d.initials || '') + '</div>' +
        '<div><div class="doc-name">' + d.fullName + '</div><div class="doc-spec">' + d.specialization + '</div></div>' +
      '</div>' +
      '<div class="doc-meta">' +
        '<span class="rating">' + star + ' ' + (d.rating || '-') + ' <span style="color:var(--ink-faint);font-weight:500;">(' + (d.reviewsCount || d.reviews || 0) + ')</span></span>' +
        '<span>' + (d.experience || '') + ' exp.</span>' +
      '</div>' +
      '<div class="doc-clinic">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg> ' +
        (d.clinic || '') +
      '</div>' +
      (d.openingHours ? '<div class="doc-hours">' + d.openingHours + '</div>' : '') +
      '<span class="doc-slot">Next: ' + (d.nextSlot || 'Contact clinic') + '</span>' +
      '<div class="doc-actions">' +
        '<button type="button" class="doc-book-btn" data-book="' + d.id + '">Book Appointment</button>' +
        (d.latitude && d.longitude ? '<a href="https://www.google.com/maps/dir/?api=1&destination=' + d.latitude + ',' + d.longitude + '" target="_blank" class="btn btn-outline btn-sm">Directions</a>' : '') +
      '</div>' +
    '</div>';

  $('#specialistGrid').innerHTML = list.filter(d => d.dentistType === 'specialist' || d.type === 'specialist').map(card).join('');
  $('#generalGrid').innerHTML = list.filter(d => d.dentistType !== 'specialist' && d.type !== 'specialist').map(card).join('');

  loadMap(list.filter(d => d.latitude && d.longitude));
  setupSearch(list, card);
}

function loadMap(dentists) {
  const container = $('#mapContainer');
  if (!dentists.length || !navigator.geolocation) {
    if (container) container.style.display = 'none';
    return;
  }
  DentinAPI.getMapKey().then(res => {
    const key = res.success ? res.data.key : '';
    if (!key) {
      if (container) container.style.display = 'none';
      return;
    }
    container.style.display = '';
    if (!window.maplibregl) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/maplibre-gl@4.1.1/dist/maplibre-gl.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/maplibre-gl@4.1.1/dist/maplibre-gl.js';
      s.onload = () => setupMap(dentists, key);
      document.head.appendChild(s);
    } else {
      setupMap(dentists, key);
    }
  });
}

function setupMap(dentists, key) {
  if (!window.maplibregl || !dentists.length) return;
  const first = dentists[0];
  mapInstance = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=' + key,
    center: [first.longitude, first.latitude],
    zoom: 13
  });
  mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
  const bounds = new maplibregl.LngLatBounds();
  dentists.forEach(d => {
    const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
      '<div style="padding:6px 2px;min-width:140px;">' +
        '<div style="font-weight:700;font-size:14px;margin-bottom:2px;">' + d.fullName + '</div>' +
        '<div style="font-size:11px;color:#666;margin-bottom:3px;">' + (d.specialization || '') + '</div>' +
        '<div style="font-size:12px;color:#2F80ED;font-weight:600;">' + (d.clinic || '') + '</div>' +
        (d.clinicAddress ? '<div style="font-size:11px;color:#999;margin-top:2px;">' + d.clinicAddress + '</div>' : '') +
      '</div>'
    );
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.innerHTML = '<div class="map-marker-dot" style="background:#' + (d.colorHex || d.color || '2F80ED') + ';"></div>' +
      '<div class="map-marker-pulse" style="border-color:#' + (d.colorHex || d.color || '2F80ED') + ';"></div>';
    new maplibregl.Marker({ element: el })
      .setLngLat([d.longitude, d.latitude])
      .setPopup(popup)
      .addTo(mapInstance);
    bounds.extend([d.longitude, d.latitude]);
  });
  if (dentists.length > 1) mapInstance.fitBounds(bounds, { padding: 50 });
}

function setupSearch(list, cardFn) {
  const input = $('#searchDoc');
  const select = $('#filterType');
  if (!input) return;
  const filter = () => {
    const q = input.value.toLowerCase();
    const t = select ? select.value : '';
    const filtered = list.filter(d => {
      const matchQ = !q || d.fullName.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q) || (d.clinic || '').toLowerCase().includes(q);
      const matchT = !t || d.dentistType === t || d.type === t;
      return matchQ && matchT;
    });
    $('#specialistGrid').innerHTML = filtered.filter(d => d.dentistType === 'specialist' || d.type === 'specialist').map(cardFn).join('');
    $('#generalGrid').innerHTML = filtered.filter(d => d.dentistType !== 'specialist' && d.type !== 'specialist').map(cardFn).join('');
  };
  input.addEventListener('input', filter);
  if (select) select.addEventListener('change', filter);
}

document.body.addEventListener('click', async e => {
  const btn = e.target.closest('[data-book]');
  if (!btn) return;
  if (!DentinAPI.sessionId()) { toast('Log in to book an appointment', 'err'); location.hash = '#/login'; return; }
  const doc = DENTIST_CACHE.find(d => String(d.id) === btn.dataset.book);
  if (doc) openBookingModal(doc);
});

function openBookingModal(doc) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal-card">' +
      '<h3>Book with ' + doc.fullName + '</h3>' +
      '<div class="msub">' + doc.specialization + (doc.clinic ? ' \u00b7 ' + doc.clinic : '') + '</div>' +
      '<div class="field-group"><label class="field-label">Date</label>' +
        '<input class="field-input" type="date" id="bookDate" min="' + new Date().toISOString().slice(0, 10) + '" required></div>' +
      '<div class="field-group"><label class="field-label">Time</label>' +
        '<input class="field-input" type="time" id="bookTime" value="14:30" required></div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn-outline" id="modalCancel">Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="modalConfirm">Confirm Booking</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#bookDate').valueAsDate = new Date();
  const close = () => overlay.remove();
  overlay.querySelector('#modalCancel').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };
  overlay.querySelector('#modalConfirm').onclick = async () => {
    const date = overlay.querySelector('#bookDate').value;
    const time = overlay.querySelector('#bookTime').value;
    if (!date || !time) { toast('Pick a date and time', 'err'); return; }
    const res = await DentinAPI.createAppointment({
      patientId: Number(DentinAPI.sessionId()), dentistId: doc.id,
      appointmentDate: date, appointmentTime: time,
      reason: doc.specialization, notes: 'Booked via Dent-in with ' + doc.fullName,
    });
    if (!res.success) { toast(res.message, 'err'); return; }
    close(); toast('Appointment booked', 'ok'); goDashboard();
  };
}

/* ============================= 6. AUTH FORMS ============================ */
let currentLoginRole = 'patient';

function applyLoginRoleUI(role) {
  currentLoginRole = role;
  $$('#loginRoleSwitch button').forEach(b => b.classList.toggle('active', b.dataset.loginRole === role));
  const banner = $('#loginBanner');
  if (banner) banner.classList.remove('show');
  const form = $('#loginForm');
  if (form) form.reset();
  if (role === 'professional') {
    const el = $('#loginEyebrow'); if (el) el.textContent = 'Staff sign-in';
    const el2 = $('#loginTitle'); if (el2) el2.textContent = 'Clinic Admin login';
    const el3 = $('#loginSub'); if (el3) el3.textContent = 'For clinic staff and dentists only. Accounts are provisioned by the clinic \u2014 there is no self-service sign-up here.';
    const el4 = $('#identifierLabel'); if (el4) el4.textContent = 'Username';
    const el5 = $('#identifier'); if (el5) { el5.placeholder = 'admin'; el5.type = 'text'; }
    const el6 = $('#loginSubmitBtn'); if (el6) el6.textContent = 'Log in to Clinic Admin';
    const el7 = $('#loginAltRow'); if (el7) el7.style.display = 'none';
  } else {
    const el = $('#loginEyebrow'); if (el) el.textContent = 'Welcome back';
    const el2 = $('#loginTitle'); if (el2) el2.textContent = 'Log in to Dent-in';
    const el3 = $('#loginSub'); if (el3) el3.textContent = 'Pick up your appointments, queue status, and dental history right where you left off.';
    const el4 = $('#identifierLabel'); if (el4) el4.textContent = 'Email or phone number';
    const el5 = $('#identifier'); if (el5) { el5.placeholder = 'you@email.com or +62 812 3456 789'; el5.type = 'text'; }
    const el6 = $('#loginSubmitBtn'); if (el6) el6.textContent = 'Log in';
    const el7 = $('#loginAltRow'); if (el7) el7.style.display = '';
  }
}

function bindLoginRoleSwitch() {
  const el = $('#loginRoleSwitch');
  if (!el || el.dataset.bound) return;
  el.dataset.bound = '1';
  el.addEventListener('click', e => {
    const btn = e.target.closest('[data-login-role]');
    if (!btn) return;
    applyLoginRoleUI(btn.dataset.loginRole);
  });
}

function bindLogin() {
  bindLoginRoleSwitch();
  const form = $('#loginForm');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const identifier = $('#identifier').value.trim();
    const password = $('#password').value;
    const banner = $('#loginBanner');
    if (!identifier || !password) { banner.textContent = 'Please fill in both fields.'; banner.classList.add('show'); return; }

    if (currentLoginRole === 'professional') {
      const res = await DentinAPI.login(identifier, password);
      if (!res.success) { banner.textContent = res.message; banner.classList.add('show'); return; }
      DentinAPI.setSession(res.data.patientId || res.data.id, res.data.token, res.data.role || 'ADMIN');
      toast('Welcome, Clinic Admin', 'ok');
      location.hash = '#/admin'; route();
      return;
    }

    const res = await DentinAPI.login(identifier, password);
    if (!res.success) { banner.textContent = res.message; banner.classList.add('show'); return; }
    DentinAPI.setSession(res.data.patientId || res.data.id, res.data.token, res.data.role);
    toast('Welcome back, ' + res.data.fullName.split(' ')[0], 'ok');
    goDashboard();
  });
}

function bindRegister() {
  const form = $('#registerForm');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';

  $$('.otp-char').forEach((input, i, arr) => {
    input.addEventListener('input', () => {
      if (input.value.length === 1 && i < arr.length - 1) arr[i + 1].focus();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && i > 0) arr[i - 1].focus();
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const banner = $('#registerBanner');
    const v = id => ($('#' + id)?.value || '').trim();
    const first = v('firstName'), last = v('lastName');
    const pw = $('#regPassword').value, pw2 = $('#confirmPassword').value;
    const email = v('regEmail') || v('email');
    if (!first || !last) { banner.textContent = 'First and last name are required.'; banner.classList.add('show'); return; }
    if (pw.length < 8) { banner.textContent = 'Password must be at least 8 characters.'; banner.classList.add('show'); return; }
    if (pw !== pw2) { banner.textContent = 'Passwords don\u2019t match.'; banner.classList.add('show'); return; }

    const otpSection = $('#otpSection');
    if (otpSection && otpSection.style.display === 'none') {
      const otpRes = await DentinAPI.sendOtp(email, 'register');
      if (!otpRes.success) { banner.textContent = otpRes.message; banner.classList.add('show'); return; }
      otpSection.style.display = '';
      const regSubmit = $('#registerSubmit'); if (regSubmit) regSubmit.style.display = 'none';
      const otpDisplay = $('#otpEmailDisplay'); if (otpDisplay) otpDisplay.textContent = email;
      toast('Verification code sent to ' + email, 'ok');
      return;
    }

    if (otpSection) {
      const otpCode = $$('.otp-char').map(el => el.value).join('');
      if (otpCode.length !== 6) { banner.textContent = 'Enter the 6-digit code.'; banner.classList.add('show'); return; }
      const verifyRes = await DentinAPI.verifyOtp(email, otpCode, 'register');
      if (!verifyRes.success) { banner.textContent = verifyRes.message; banner.classList.add('show'); return; }
    }

    const res = await DentinAPI.register({
      fullName: [first, v('middleName'), last].filter(Boolean).join(' '),
      email: email, phone: v('phone') || undefined,
      address: null, dateOfBirth: null, gender: null,
      emergencyContact: null, medicalHistory: null, password: pw,
    });
    if (!res.success) { banner.textContent = res.message; banner.classList.add('show'); return; }
    DentinAPI.setSession(res.data.patientId || res.data.id, res.data.token, res.data.role);
    toast('Account created', 'ok');
    goDashboard();
  });

  const verifyBtn = $('#verifyOtpBtn');
  if (verifyBtn) verifyBtn.addEventListener('click', e => { e.preventDefault(); form.requestSubmit(); });

  const resendBtn = $('#resendOtpBtn');
  if (resendBtn) resendBtn.addEventListener('click', async () => {
    const email = ($('#regEmail') || $('#email'))?.value?.trim();
    if (!email) { toast('Enter your email first', 'err'); return; }
    await DentinAPI.sendOtp(email, 'register');
    toast('Code resent to ' + email, 'ok');
  });
}

/* ============================= 7. HERO CARDS ============================ */
function updateHeroCards(p, appt, pres) {
  const am = $('#heroApptMain'), as = $('#heroApptSub');
  const mm = $('#heroMedMain'), ms = $('#heroMedSub');
  if (!am || !mm) return;
  if (!p) {
    am.textContent = 'Routine Dental Checkup';
    as.textContent = '';
    mm.textContent = 'Time for a check-up';
    ms.textContent = '';
    return;
  }
  if (appt) {
    const d = appt.dentist || {};
    am.textContent = (appt.reason || 'Dental Checkup').split('\u00b7')[0].trim();
    as.textContent = fmtApptDate(appt.appointmentDate) + ' \u00b7 ' + shortTime(appt.appointmentTime) + (d.fullName ? ' \u00b7 ' + d.fullName : '');
  } else {
    am.textContent = 'No upcoming appointment';
    as.textContent = 'Book a dentist to see it here';
  }
  if (pres) {
    mm.textContent = 'Active prescription';
    ms.textContent = pres.instructions || 'Check your dashboard for details';
  } else {
    mm.textContent = 'No active reminders';
    ms.textContent = 'Care tips appear here';
  }
}

/* ============================= 8. DASHBOARD ============================ */
const DANGER_SCORE = 45;

async function renderDashboard() {
  const shell = $('#dashShell'), lop = $('#loggedOutPanel');
  if (!shell || !lop) return;
  const p = await DentinAPI.currentPatient();
  if (!p) { shell.style.display = 'none'; lop.style.display = ''; updateHeroCards(null, null, null); return; }
  shell.style.display = ''; lop.style.display = 'none';

  $('#dashPfp').textContent = initials(p);
  $('#dashName').textContent = p.fullName;
  const h = new Date().getHours();
  $('#dashGreeting').textContent = h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,';

  loadNotifications(p.id);

  const [ar, sr, pr] = await Promise.all([
    DentinAPI.getAppointmentsByPatient(p.id),
    DentinAPI.getScansByPatient(p.id),
    DentinAPI.getPrescriptionsByPatient(p.id),
  ]);
  const appts = (ar.data || []).filter(a => a.status !== 'CANCELLED');
  const appt = appts[appts.length - 1] || null;
  const scans = sr.data || [];
  const scan = scans[scans.length - 1] || null;
  const pres = (pr.data || [])[pr.data.length - 1] || null;

  if (appt && appt.dentistId) {
    const d = await DentinAPI.findDentist(appt.dentistId);
    if (d) appt.dentist = d;
  }

  updateHeroCards(p, appt, pres);

  $('#dashGrid').innerHTML = [
    dangerAlertBanner(scan),
    apptCard(appt), queueCard(appt), consultationCard(appt, scan),
    medicationCard(pres), followUpCard(scan), healthStatusCard(scan),
    hospitalCard(scan), scannerCard(scan), historyCard(appt, scan),
  ].join('');

  wireScanner(p);
  const manage = $('#manageApptBtn');
  if (manage) manage.onclick = async () => {
    const res = await DentinAPI.cancelAppointment(appt.id);
    if (res.success) { toast('Appointment cancelled', 'ok'); renderDashboard(); }
    else toast(res.message, 'err');
  };
}

/* ======================== NOTIFICATION PANEL ============================ */
async function loadNotifications(patientId) {
  const countRes = await DentinAPI.getUnreadCount(patientId);
  const badge = $('#notifCount');
  if (!badge) return;
  if (countRes.success && countRes.data && countRes.data.count > 0) {
    badge.textContent = countRes.data.count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

const notifBell = $('#notifBell');
if (notifBell) notifBell.addEventListener('click', async () => {
  const panel = $('#notifPanel');
  if (!panel) return;
  const isOpen = !panel.classList.contains('hidden');
  if (isOpen) { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  const p = await DentinAPI.currentPatient();
  if (!p) return;
  const res = await DentinAPI.getNotifications(p.id);
  const list = res.success ? (res.data || []) : [];
  const notifList = $('#notifList');
  if (!notifList) return;
  notifList.innerHTML = list.length ? list.map(n =>
    '<div class="notif-item ' + (n.read ? '' : 'unread') + '" data-notif-id="' + n.id + '">' +
      '<div class="notif-title">' + n.title + '</div>' +
      '<div class="notif-msg">' + n.message + '</div>' +
      '<div class="notif-time">' + new Date(n.createdAt).toLocaleString() + '</div>' +
    '</div>'
  ).join('') : '<div class="notif-empty">No notifications yet.</div>';
  $$('.notif-item.unread', panel).forEach(el => {
    el.addEventListener('click', async () => {
      await DentinAPI.markNotifRead(el.dataset.notifId);
      el.classList.remove('unread');
      loadNotifications(p.id);
    });
  });
});

const notifMarkAll = $('#notifMarkAll');
if (notifMarkAll) notifMarkAll.addEventListener('click', async () => {
  const p = await DentinAPI.currentPatient();
  if (p) { await DentinAPI.markAllRead(p.id); loadNotifications(p.id); $$('.notif-item.unread').forEach(el => el.classList.remove('unread')); }
});

/* ======================== DASHBOARD CARDS =============================== */
function emptyCard(col, icon, title, sub, href, cta) {
  return '<div class="card ' + col + '"><div class="empty-card">' +
    '<div class="ec-icon">' + icon + '</div><div class="ec-title">' + title + '</div>' +
    '<div class="ec-sub">' + sub + '</div>' +
    (href ? '<a href="' + href + '" class="btn btn-primary">' + cta + '</a>' : '') +
  '</div></div>';
}

const IC = {
  cal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5"/></svg>',
  chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>',
  pill: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 12.5 9 17l10.5-10.5"/></svg>',
};

function apptCard(appt) {
  if (!appt) return emptyCard('col-5', IC.cal, 'No upcoming appointment', 'Book with a verified dentist to see your appointment details here.', '#/find', 'Find a Doctor');
  const d = appt.dentist || {};
  const nice = { SCHEDULED: 'Scheduled', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In progress', COMPLETED: 'Completed' }[appt.status] || appt.status;
  return '<div class="card appt-card col-5">' +
    '<div class="card-head"><div class="card-label">Upcoming Appointment</div>' +
      '<span class="chip" style="background:rgba(255,255,255,0.2);color:#fff;">' + nice + '</span></div>' +
    '<div class="appt-doc"><div class="dpfp">' + (d.initials || '') + '</div>' +
      '<div><div class="dname">' + (d.fullName || '') + '</div><div class="dspec">' + (d.specialization || '') + '</div></div></div>' +
    '<div class="appt-meta">' +
      '<div><span>Date</span><span>' + fmtApptDate(appt.appointmentDate) + '</span></div>' +
      '<div><span>Time</span><span>' + shortTime(appt.appointmentTime) + '</span></div>' +
      '<div><span>Clinic</span><span>' + (d.clinic || '') + '</span></div></div>' +
    '<button class="appt-btn" id="manageApptBtn">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg> ' +
      'Cancel Appointment</button></div>';
}

function queueCard(appt) {
  if (!appt) return emptyCard('col-3', IC.clock, 'No active queue', 'A live queue number appears once you have an appointment today.', '', '');
  if (!isToday(appt.appointmentDate)) return '<div class="card col-3">' +
    '<div class="card-head"><div class="card-label">Queue Number</div></div>' +
    '<div style="font-size:15px;font-weight:700;margin:10px 0 6px;">Not open yet</div>' +
    '<div class="queue-sub">Your live queue number opens on ' + fmtApptDate(appt.appointmentDate) + ', the day of your visit.</div></div>';
  return '<div class="card col-3">' +
    '<div class="card-head"><div class="card-label">Queue Number</div><span class="chip chip-live">\u25cf Live</span></div>' +
    '<div class="queue-num">B-14</div><div class="queue-sub">3 patients ahead of you</div>' +
    '<div class="progress-track"><div class="progress-fill"></div></div>' +
    '<div class="queue-foot"><span>Est. wait</span><span>~18 min</span></div></div>';
}

function consultationCard(appt, scan) {
  if (!appt && !scan) return emptyCard('col-4', IC.chat, 'No consultations yet', 'X-rays, scan results and treatment notes show up here after your first visit or scan.', '', '');
  const analysis = parseAnalysis(scan);
  const done = scan && scan.status === 'COMPLETED' && analysis;
  return '<div class="card col-4"><div class="card-head"><div class="card-label">Consultation Status</div></div>' +
    '<div class="status-row"><div class="status-ico" style="background:rgba(47,128,237,0.12);">' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2F80ED" stroke-width="2.4"><path d="M5 12l4 4 10-10"/></svg></div>' +
      '<div class="status-txt"><div class="t1">' + (appt ? 'Appointment confirmed' : 'Scan received') + '</div>' +
      '<div class="t2">' + (appt ? ((appt.dentist || {}).fullName || '') + ' \u00b7 booked' : 'Awaiting dentist review') + '</div></div></div>' +
    '<div class="status-row"><div class="status-ico" style="background:' + (done ? 'rgba(0,200,150,.16)' : 'rgba(242,201,78,0.18)') + ';">' +
      (done ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#019a76" stroke-width="2.4"><path d="M5 12l4 4 10-10"/></svg>'
        : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9a7b0a" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>') + '</div>' +
      '<div class="status-txt"><div class="t1">' + (done ? 'AI analysis complete' : 'Awaiting visit') + '</div>' +
      '<div class="t2">' + (done ? 'Health score ' + analysis.overall_health_score + '/100'
        : (appt ? 'Notes appear after ' + fmtApptDate(appt.appointmentDate) : 'Run the scanner below')) + '</div></div></div></div>';
}

function medicationCard(pres) {
  if (!pres) return emptyCard('col-4', IC.pill, 'No medications added', 'After a scan or consultation your dentist can send a prescription \u2014 it shows up here.', '', '');
  return '<div class="card col-4"><div class="card-head"><div class="card-label">Medication</div><span class="chip chip-live">Sent</span></div>' +
    '<div style="font-size:15px;font-weight:800;margin:4px 0 2px;">' + (pres.medicationDetails || '') + '</div>' +
    '<div class="ec-sub" style="text-align:left;margin:0 0 10px;">' + (pres.instructions || '') + '</div>' +
    '<div class="status-row"><button class="med-check" type="button" aria-label="Mark as taken"></button>' +
    '<div class="status-txt"><div class="t1">Mark as taken</div><div class="t2">' + (pres.notesToPatient || '') + '</div></div></div></div>';
}

function followUpCard(scan) {
  const analysis = parseAnalysis(scan);
  if (!(scan && scan.status === 'COMPLETED' && analysis)) return emptyCard('col-4', IC.cal, 'No follow-up scheduled', 'Follow-up visits show up here once a dentist recommends one.', '', '');
  return '<div class="card col-4"><div class="card-head"><div class="card-label">Recommended Follow-up</div>' +
    '<span class="chip" style="background:rgba(242,201,78,.2);color:#9a7b0a;">Advised</span></div>' +
    '<div style="font-size:15px;font-weight:800;margin:6px 0 4px;">Professional cleaning</div>' +
    '<div class="ec-sub" style="text-align:left;margin:0;">Advised within 2 weeks based on your AI scan. Book a general dentist to schedule it.</div>' +
    '<a href="#/find" class="btn btn-outline" style="margin-top:12px;">Book follow-up</a></div>';
}

function healthStatusCard(scan) {
  const analysis = parseAnalysis(scan);
  if (!(scan && scan.status === 'COMPLETED' && analysis)) return emptyCard('col-4', IC.check, 'Health score not available', 'Run the dental scanner below and we\u2019ll start tracking your gum, enamel and alignment health.', '', '');
  const s = analysis.overall_health_score;
  const dangerous = s < DANGER_SCORE;
  const label = s >= 80 ? 'Good' : s >= 60 ? 'Fair \u2014 needs attention' : dangerous ? 'Dangerous' : 'Needs care';
  return '<div class="card col-4"><div class="card-head"><div class="card-label">Dental Health Score</div>' +
      (dangerous ? '<span class="chip chip-danger">\u26a0 Dangerous</span>' : '') + '</div>' +
    '<div class="sr-score-wrap" style="margin-top:8px;">' + scoreRing(s) +
    '<div class="sr-score-txt"><div class="n">' + s + '<span style="font-size:14px;color:var(--ink-faint);">/100</span></div>' +
    '<div class="l" style="' + (dangerous ? 'color:var(--danger);font-weight:700;' : '') + '">' + label + '</div>' +
    '<div class="sr-conf">AI confidence ' + scan.confidenceScore + '%</div></div></div></div>';
}

function dangerAlertBanner(scan) {
  if (!(scan && scan.status === 'COMPLETED')) return '';
  const analysis = parseAnalysis(scan);
  if (!analysis) return '';
  const s = analysis.overall_health_score;
  if (s >= DANGER_SCORE) return '';
  return '<div class="card col-12" style="background:rgba(235,87,87,0.08); border:1px solid rgba(235,87,87,0.35); display:flex; align-items:center; gap:14px; flex-wrap:wrap;">' +
      '<div style="width:38px;height:38px;border-radius:12px;background:rgba(235,87,87,0.16);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.4"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>' +
      '</div>' +
      '<div style="flex:1;min-width:220px;">' +
        '<div style="font-weight:800;color:var(--danger);font-size:14.5px;">Dental health score: ' + s + '/100 \u2014 Dangerous</div>' +
        '<div style="font-size:13px;color:var(--ink-soft);margin-top:2px;">This result suggests a condition that needs urgent, in-person care. Please head to the nearest hospital as soon as possible.</div>' +
      '</div>' +
      '<a href="https://maps.app.goo.gl/kLEJaokZfsFpsG8m8" target="_blank" rel="noopener" class="btn" ' +
        'style="background:var(--danger);color:#fff;padding:10px 18px;font-size:13px;white-space:nowrap;">Get directions</a>' +
    '</div>';
}

function hospitalCard(scan) {
  if (!(scan && scan.status === 'COMPLETED')) return '';
  const analysis = parseAnalysis(scan);
  if (!analysis || analysis.overall_health_score >= DANGER_SCORE) return '';
  const mapsUrl = 'https://maps.app.goo.gl/kLEJaokZfsFpsG8m8';
  const embedSrc = 'https://www.google.com/maps?q=-6.9437447,107.6496471&z=16&output=embed';
  return '<div class="card col-4" style="padding:14px;">' +
      '<div class="card-head" style="padding:6px 6px 0;"><div class="card-label">Location</div></div>' +
      '<a href="' + mapsUrl + '" target="_blank" rel="noopener" aria-label="Open Rumah Sakit Edelweiss in Google Maps" ' +
        'style="display:block; border-radius:14px; overflow:hidden; border:1px solid var(--line);">' +
        '<iframe src="' + embedSrc + '" width="100%" height="150" style="border:0; display:block; pointer-events:none;" ' +
          'loading="lazy" title="Map to Rumah Sakit Edelweiss"></iframe>' +
      '</a>' +
      '<div class="clinic-pop" style="position:static;margin-top:10px;">' +
        '<div><div class="cname">Rumah Sakit Edelweiss</div>' +
          '<div class="cmeta">Jl. Soekarno Hatta No. 550, Sekejati</div></div>' +
        '<a href="' + mapsUrl + '" target="_blank" rel="noopener" aria-label="Open route in Google Maps">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F80ED" stroke-width="2.4"><path d="M9 18l6-6-6-6"/></svg>' +
        '</a>' +
      '</div></div>';
}

function historyCard(appt, scan) {
  const analysis = parseAnalysis(scan);
  const items = [];
  if (scan && scan.status === 'COMPLETED' && analysis)
    items.push(['AI teeth scan', 'Score ' + analysis.overall_health_score + '/100 \u00b7 ' + (analysis.teeth_detected || '?') + ' teeth detected']);
  if (appt) items.push(['Appointment booked', ((appt.dentist || {}).fullName || '') + ' \u00b7 ' + fmtApptDate(appt.appointmentDate)]);
  if (!items.length) return '<div class="card col-4"><div class="card-head"><div class="card-label">Recent Dental History</div></div>' +
    '<div class="empty-card"><div class="ec-icon">' + IC.clock + '</div><div class="ec-title">No visits yet</div>' +
    '<div class="ec-sub">Your treatment history will build up here after each appointment.</div></div></div>';
  return '<div class="card col-4"><div class="card-head"><div class="card-label">Recent Dental History</div></div>' +
    items.map(([t, s]) => '<div class="status-row"><div class="status-ico" style="background:rgba(47,128,237,.1);">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F80ED" stroke-width="2.2"><path d="M5 12l4 4 10-10"/></svg></div>' +
      '<div class="status-txt"><div class="t1">' + t + '</div><div class="t2">' + s + '</div></div></div>').join('') + '</div>';
}

/* =========================== SCANNER CARD =============================== */
function scannerCard(scan) {
  const analysis = parseAnalysis(scan);
  const done = scan && scan.status === 'COMPLETED' && analysis;
  const slot = key => '<label class="upload-slot" data-slot="' + key + '">' +
    '<svg class="up-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
    '<div class="up-label">' + key[0].toUpperCase() + key.slice(1) + '</div>' +
    '<input type="file" accept="image/*" capture="environment"></label>';
  return '<div class="card col-4" id="scanCard">' +
    '<div class="card-head"><div class="card-label">Dental Condition Scanner</div>' +
      '<span class="chip chip-live">' + (done ? 'Analysed' : 'AI') + '</span></div>' +
    '<div class="upload-row">' + slot('front') + slot('right') + slot('left') + '</div>' +
    '<button id="scanSubmit" class="scan-submit" disabled>Upload 3 more photos</button>' +
    '<div id="scanResult">' + (done ? scanResultHTML(scan, analysis) : '') + '</div></div>';
}

function scoreRing(score) {
  const r = 26, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const col = score >= 80 ? '#00C896' : score >= 60 ? '#F2C94C' : '#EB5757';
  return '<svg class="sr-ring" viewBox="0 0 66 66"><circle cx="33" cy="33" r="' + r + '" fill="none" stroke="#e7eef7" stroke-width="7"/>' +
    '<circle cx="33" cy="33" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" ' +
    'stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 33 33)"/>' +
    '<text x="33" y="38" text-anchor="middle" font-size="16" font-weight="800" fill="#0E2A47">' + score + '</text></svg>';
}

function scanResultHTML(scan, a) {
  const issue = i => '<div class="sr-issue"><span class="tag ' + (i.severity === 'mild' ? 'mild' : 'early') + '">' + i.severity + '</span>' +
    '<span class="txt"><b style="color:var(--ink);text-transform:capitalize;">' + i.type + '</b> \u2014 ' + String(i.location).replace('_', ' ') + '</span></div>';
  return '<div class="scan-result">' +
    '<div class="sr-head"><div class="sr-score-wrap">' + scoreRing(a.overall_health_score) +
      '<div class="sr-score-txt"><div class="n">' + a.overall_health_score + '<span style="font-size:13px;color:var(--ink-faint);">/100</span></div>' +
      '<div class="l">' + a.teeth_detected + ' teeth detected</div><div class="sr-conf">AI confidence ' + scan.confidenceScore + '%</div></div></div></div>' +
    '<div class="sr-issues">' + (a.issues_found || []).map(issue).join('') + '</div>' +
    '<div class="sr-rec">Recommendation: ' + (scan.recommendations || '') + '.</div></div>';
}

/* =================== SCANNER: UPLOAD 3 -> ANALYZE ====================== */
const scanState = { front: null, right: null, left: null };

function wireScanner(patient) {
  Object.keys(scanState).forEach(k => scanState[k] = null);
  const card = $('#scanCard');
  if (!card) return;
  $$('.upload-slot', card).forEach(el => {
    const slot = el.dataset.slot, input = el.querySelector('input');
    el.addEventListener('click', e => { if (!e.target.closest('.up-remove')) input.click(); });
    input.addEventListener('change', e => { const f = e.target.files[0]; if (f) takeScan(slot, f); });
    ['dragover', 'dragleave', 'drop'].forEach(ev => el.addEventListener(ev, e => e.preventDefault()));
    el.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) takeScan(slot, f); });
  });
  updateScanBtn();
  $('#scanSubmit').addEventListener('click', async () => {
    if (!Object.values(scanState).every(Boolean)) return;
    const btn = $('#scanSubmit');
    const result = $('#scanResult');
    result.innerHTML = '<div class="scan-analyzing"><span class="scan-spin"></span> Running AI dental analysis\u2026</div>';
    btn.disabled = true; btn.textContent = 'Analysing\u2026';

    const up = await DentinAPI.uploadScan(patient.id, scanState.front);
    if (!up.success) { toast(up.message, 'err'); result.innerHTML = ''; updateScanBtn(); return; }
    const an = await DentinAPI.analyzeScan(up.data.id);
    if (!an.success) { toast(an.message, 'err'); result.innerHTML = ''; updateScanBtn(); return; }

    await DentinAPI.createPrescription({
      patientId: patient.id, dentistId: 6,
      diagnosis: an.data.detectedIssues,
      medicationDetails: 'Chlorhexidine 0.2% mouthwash',
      instructions: 'Rinse 10ml twice daily for 14 days',
      notesToPatient: 'Prescribed by Dr. Marco Belline after your AI scan',
    });
    const analysis = parseAnalysis(an.data);
    toast('AI analysis complete \u2014 health score ' + (analysis ? analysis.overall_health_score : ''), 'ok');
    renderDashboard();
  });
}

function takeScan(slot, file) {
  if (!file.type.startsWith('image/')) { toast('Please upload an image file', 'err'); return; }
  scanState[slot] = file;
  const reader = new FileReader();
  reader.onload = e => paintSlot(slot, e.target.result);
  reader.readAsDataURL(file);
}

function paintSlot(slot, dataUrl) {
  const el = $('.upload-slot[data-slot="' + slot + '"]');
  if (!el) return;
  const label = slot[0].toUpperCase() + slot.slice(1);
  el.classList.add('filled');
  el.innerHTML = '<img src="' + dataUrl + '" alt="' + label + ' teeth">' +
    '<div class="up-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 12l4 4 10-10"/></svg></div>' +
    '<button type="button" class="up-remove" aria-label="Remove ' + label + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
    '<input type="file" accept="image/*" capture="environment">';
  const input = el.querySelector('input');
  el.onclick = e => { if (!e.target.closest('.up-remove')) input.click(); };
  input.onchange = e => { const f = e.target.files[0]; if (f) takeScan(slot, f); };
  el.querySelector('.up-remove').onclick = e => { e.stopPropagation(); scanState[slot] = null; unpaintSlot(slot); updateScanBtn(); };
  updateScanBtn();
}

function unpaintSlot(slot) {
  const el = $('.upload-slot[data-slot="' + slot + '"]');
  if (!el) return;
  const label = slot[0].toUpperCase() + slot.slice(1);
  el.classList.remove('filled');
  el.innerHTML = '<svg class="up-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
    '<div class="up-label">' + label + '</div><input type="file" accept="image/*" capture="environment">';
  const input = el.querySelector('input');
  el.onclick = e => { if (!e.target.closest('.up-remove')) input.click(); };
  input.onchange = e => { const f = e.target.files[0]; if (f) takeScan(slot, f); };
}

function updateScanBtn() {
  const btn = $('#scanSubmit');
  if (!btn) return;
  const left = Object.values(scanState).filter(v => !v).length;
  btn.classList.toggle('ready', left === 0);
  btn.disabled = left !== 0;
  btn.textContent = left === 0 ? 'Run AI Analysis' : 'Upload ' + left + ' more photo' + (left > 1 ? 's' : '');
}

/* ============================= 9. ADMIN PANEL =========================== */
let adminActiveTab = 'overview';

async function adminData() {
  const [patientsRes, dentistsRes, apptsRes, scansRes, presRes] = await Promise.all([
    DentinAPI.getPatients(),
    DentinAPI.getDentists(),
    DentinAPI.getAllAppointments(),
    DentinAPI.getAllScans(),
    DentinAPI.getAllPrescriptions(),
  ]);
  return {
    patients: patientsRes.success ? patientsRes.data : [],
    dentists: dentistsRes.success ? dentistsRes.data : [],
    appts: apptsRes.success ? apptsRes.data : [],
    scans: scansRes.success ? scansRes.data : [],
    pres: presRes.success ? presRes.data : [],
  };
}

async function adminPatientName(id) {
  const p = await DentinAPI.findPatient(id);
  return p ? p.fullName : 'Patient #' + id;
}

async function adminDentistName(id) {
  const d = await DentinAPI.findDentist(id);
  return d ? d.fullName : (id ? 'Dentist #' + id : '\u2014');
}

async function renderAdmin() {
  if (!DentinAPI.isAdmin()) { toast('Admin access only', 'err'); location.hash = '#/home'; route(); return; }
  const d = await adminData();
  DentinAPI.clearCaches();

  renderAdminKpis(d);

  $$('#adminTabs .admin-tab').forEach(b => b.classList.toggle('active', b.dataset.adminTab === adminActiveTab));
  await renderAdminPanel(d);
}

const adminTabs = $('#adminTabs');
if (adminTabs) adminTabs.addEventListener('click', e => {
  const btn = e.target.closest('[data-admin-tab]');
  if (!btn) return;
  adminActiveTab = btn.dataset.adminTab;
  renderAdmin();
});

function renderAdminKpis(d) {
  const today = new Date().toISOString().slice(0, 10);
  const kpis = [
    { label: 'Total Patients', num: d.patients.length, ico: IC.check, bg: 'rgba(47,128,237,.12)', col: '#2F80ED' },
    { label: "Today's Appointments", num: d.appts.filter(a => a.appointmentDate === today && a.status !== 'CANCELLED').length, ico: IC.cal, bg: 'rgba(0,200,150,.14)', col: '#00C896' },
    { label: 'Awaiting Confirmation', num: d.appts.filter(a => a.status === 'SCHEDULED').length, ico: IC.clock, bg: 'rgba(242,201,78,.2)', col: '#9a7b0a' },
    { label: 'Pending AI Analysis', num: d.scans.filter(s => s.status !== 'COMPLETED').length, ico: IC.chat, bg: 'rgba(235,87,87,.1)', col: '#EB5757' },
    { label: 'Prescriptions Sent', num: d.pres.length, ico: IC.pill, bg: 'rgba(47,128,237,.12)', col: '#2F80ED' },
    { label: 'Active Dentists', num: d.dentists.filter(x => x.active !== false).length + '/' + d.dentists.length, ico: IC.check, bg: 'rgba(0,200,150,.14)', col: '#00C896' },
  ];
  const kpiRow = $('#adminKpiRow');
  if (kpiRow) kpiRow.innerHTML = kpis.map(k =>
    '<div class="kpi-card"><div class="kpi-ico" style="background:' + k.bg + ';color:' + k.col + ';">' + k.ico + '</div>' +
    '<div class="kpi-num">' + k.num + '</div><div class="kpi-label">' + k.label + '</div></div>'
  ).join('');

  const cntAppt = $('#cntAppt'); if (cntAppt) cntAppt.textContent = d.appts.filter(a => a.status !== 'CANCELLED').length;
  const cntPatients = $('#cntPatients'); if (cntPatients) cntPatients.textContent = d.patients.length;
  const cntDentists = $('#cntDentists'); if (cntDentists) cntDentists.textContent = d.dentists.length;
  const cntScans = $('#cntScans'); if (cntScans) cntScans.textContent = d.scans.length;
  const cntPres = $('#cntPres'); if (cntPres) cntPres.textContent = d.pres.length;
}

async function renderAdminPanel(d) {
  const panel = $('#adminPanel');
  if (!panel) return;
  if (adminActiveTab === 'overview') { panel.innerHTML = await adminOverviewHTML(d); return; }
  if (adminActiveTab === 'appointments') { panel.innerHTML = await adminAppointmentsHTML(d); await wireAdminAppointments(); return; }
  if (adminActiveTab === 'patients') { panel.innerHTML = await adminPatientsHTML(d); wireAdminSearch('patients'); return; }
  if (adminActiveTab === 'dentists') { panel.innerHTML = await adminDentistsHTML(d); wireAdminDentists(); return; }
  if (adminActiveTab === 'scans') { panel.innerHTML = await adminScansHTML(d); await wireAdminScans(); return; }
  if (adminActiveTab === 'prescriptions') { panel.innerHTML = await adminPrescriptionsHTML(d); return; }
}

/* ---------- Reusable modal + option builders + delete ---------- */
function adminModal(title, bodyHTML, onSubmit, submitLabel) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-card">' +
      '<h3>' + title + '</h3>' +
      '<div style="max-height:60vh;overflow:auto;">' + bodyHTML + '</div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn btn-outline" data-mclose>Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-msubmit>' + (submitLabel || 'Save') + '</button>' +
      '</div></div>';
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('[data-mclose]').onclick = close;
  overlay.querySelector('[data-msubmit]').onclick = () => { if (onSubmit(overlay) !== false) close(); };
  return overlay;
}

function patientOptionsHtml(sel) {
  const list = DentinAPI._patientsCache || [];
  if (!list.length) return '<option value="">(no patients yet)</option>';
  return list.map(p => '<option value="' + p.id + '" ' + (p.id === sel ? 'selected' : '') + '>' + p.fullName + ' (' + p.email + ')</option>').join('');
}

function dentistOptionsHtml(sel, activeOnly) {
  const list = DentinAPI._dentistsCache || [];
  const filtered = activeOnly ? list.filter(x => x.active !== false) : list;
  return filtered.map(x => '<option value="' + x.id + '" ' + (x.id === sel ? 'selected' : '') + '>' + x.fullName + ' \u00b7 ' + x.specialization + '</option>').join('');
}

async function adminDelete(kind, id, label) {
  if (!confirm('Delete ' + label + '?\nThis action cannot be undone.')) return;
  const fnMap = { patient: 'deletePatient', appt: 'deleteAppointment', scan: 'deleteScan', pres: 'deletePrescription', dentist: 'deleteDentist' };
  const fn = fnMap[kind];
  if (!fn) return;
  const res = await DentinAPI[fn](id);
  if (!res.success) { toast(res.message, 'err'); return; }
  DentinAPI.clearCaches();
  toast('Deleted', 'ok'); renderAdmin();
}

function adminAddPatient() {
  adminModal('Add Patient',
    '<div class="field-group"><label class="field-label">Full name</label><input class="field-input" id="npName"></div>' +
    '<div class="field-group"><label class="field-label">Email</label><input class="field-input" id="npEmail" type="email"></div>' +
    '<div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="npPhone"></div>' +
    '<div class="field-group"><label class="field-label">Gender</label>' +
      '<select class="field-input" id="npGender"><option value="">\u2014</option><option>Male</option><option>Female</option><option>Other</option></select></div>' +
    '<div class="field-group"><label class="field-label">Password (optional)</label><input class="field-input" id="npPass" type="text"></div>',
    async ov => {
      const name = ov.querySelector('#npName').value.trim(), email = ov.querySelector('#npEmail').value.trim();
      if (!name || !email) { toast('Name and email are required', 'err'); return false; }
      const res = await DentinAPI.register({
        fullName: name, email: email, phone: ov.querySelector('#npPhone').value.trim(),
        gender: ov.querySelector('#npGender').value || null, password: ov.querySelector('#npPass').value || 'password123',
      });
      if (!res.success) { toast(res.message, 'err'); return false; }
      DentinAPI.clearCaches();
      toast('Patient added', 'ok'); renderAdmin();
    }, 'Add');
}

async function adminAddAppointment() {
  const patientsRes = await DentinAPI.getPatients();
  const list = patientsRes.success ? patientsRes.data : [];
  if (!list.length) { toast('Add a patient first before creating an appointment', 'err'); return; }
  DentinAPI.clearCaches();
  const pData = await adminData();

  adminModal('Add Appointment',
    '<div class="field-group"><label class="field-label">Patient</label><select class="field-input" id="naPatient">' + patientOptionsHtml() + '</select></div>' +
    '<div class="field-group"><label class="field-label">Dentist</label><select class="field-input" id="naDentist">' + dentistOptionsHtml(null, true) + '</select></div>' +
    '<div class="field-group"><label class="field-label">Date</label><input class="field-input" type="date" id="naDate" min="' + new Date().toISOString().slice(0, 10) + '"></div>' +
    '<div class="field-group"><label class="field-label">Time</label><input class="field-input" type="time" id="naTime" value="10:00"></div>' +
    '<div class="field-group"><label class="field-label">Reason (optional)</label><input class="field-input" id="naReason"></div>',
    async ov => {
      const date = ov.querySelector('#naDate').value, time = ov.querySelector('#naTime').value;
      if (!date || !time) { toast('Date and time are required', 'err'); return false; }
      const res = await DentinAPI.createAppointment({
        patientId: Number(ov.querySelector('#naPatient').value),
        dentistId: Number(ov.querySelector('#naDentist').value),
        appointmentDate: date, appointmentTime: time,
        reason: ov.querySelector('#naReason').value || null,
      });
      if (!res.success) { toast(res.message, 'err'); return false; }
      DentinAPI.clearCaches();
      toast('Appointment created', 'ok'); renderAdmin();
    }, 'Add');
}

function adminAddDentist() {
  adminModal('Add Dentist',
    '<div class="field-group"><label class="field-label">Full name</label><input class="field-input" id="ndName" placeholder="Dr. ..."></div>' +
    '<div class="field-group"><label class="field-label">Specialization</label><input class="field-input" id="ndSpec" placeholder="General Dentist \u00b7 Checkups"></div>' +
    '<div class="field-group"><label class="field-label">Type</label>' +
      '<select class="field-input" id="ndType"><option value="general">General</option><option value="specialist">Specialist</option></select></div>' +
    '<div class="field-group"><label class="field-label">Experience</label><input class="field-input" id="ndExp" placeholder="5 yrs"></div>' +
    '<div class="field-group"><label class="field-label">Email</label><input class="field-input" id="ndEmail" type="email"></div>' +
    '<div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="ndPhone"></div>' +
    '<div class="field-group"><label class="field-label">Clinic</label><input class="field-input" id="ndClinic"></div>' +
    '<div class="field-group"><label class="field-label">License Number</label><input class="field-input" id="ndLicense"></div>',
    async ov => {
      const name = ov.querySelector('#ndName').value.trim();
      if (!name) { toast('Dentist name is required', 'err'); return false; }
      const res = await DentinAPI.createDentist({
        fullName: name, specialization: ov.querySelector('#ndSpec').value.trim(),
        dentistType: ov.querySelector('#ndType').value, experience: ov.querySelector('#ndExp').value.trim(),
        email: ov.querySelector('#ndEmail').value.trim(), phone: ov.querySelector('#ndPhone').value.trim(),
        clinic: ov.querySelector('#ndClinic').value.trim() || null,
        licenseNumber: ov.querySelector('#ndLicense').value.trim() || null,
        colorHex: '2F80ED',
        initials: name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
      });
      if (!res.success) { toast(res.message, 'err'); return false; }
      DentinAPI.clearCaches();
      toast('Dentist added', 'ok'); renderAdmin();
    }, 'Add');
}

async function adminAddScan() {
  const patientsRes = await DentinAPI.getPatients();
  const list = patientsRes.success ? patientsRes.data : [];
  if (!list.length) { toast('Add a patient first', 'err'); return; }
  DentinAPI.clearCaches();
  const pData = await adminData();

  adminModal('Add AI Scan',
    '<div class="field-group"><label class="field-label">Patient</label><select class="field-input" id="nsPatient">' + patientOptionsHtml() + '</select></div>' +
    '<div class="field-group"><label class="field-label">Dentist (optional)</label><select class="field-input" id="nsDentist"><option value="">\u2014</option>' + dentistOptionsHtml(null, false) + '</select></div>' +
    '<p class="ec-sub" style="text-align:left;margin:4px 0 0;">Scan will be created with UPLOADED status. Run "AI Analysis" from the table to get a health score.</p>',
    async ov => {
      const did = ov.querySelector('#nsDentist').value;
      const patientId = Number(ov.querySelector('#nsPatient').value);
      const dummyFile = new File([''], 'scan.jpg', { type: 'image/jpeg' });
      const res = await DentinAPI.uploadScan(patientId, dummyFile);
      if (!res.success) { toast(res.message, 'err'); return false; }
      DentinAPI.clearCaches();
      toast('Scan added', 'ok'); renderAdmin();
    }, 'Add');
}

async function adminAddPrescription() {
  const patientsRes = await DentinAPI.getPatients();
  const list = patientsRes.success ? patientsRes.data : [];
  if (!list.length) { toast('Add a patient first', 'err'); return; }
  DentinAPI.clearCaches();
  const pData = await adminData();

  adminModal('Add Prescription',
    '<div class="field-group"><label class="field-label">Patient</label><select class="field-input" id="nrPatient">' + patientOptionsHtml() + '</select></div>' +
    '<div class="field-group"><label class="field-label">Dentist</label><select class="field-input" id="nrDentist">' + dentistOptionsHtml(null, false) + '</select></div>' +
    '<div class="field-group"><label class="field-label">Diagnosis (optional)</label><input class="field-input" id="nrDiag"></div>' +
    '<div class="field-group"><label class="field-label">Medication name &amp; dose</label><input class="field-input" id="nrMed" placeholder="e.g. Chlorhexidine 0.2% mouthwash"></div>' +
    '<div class="field-group"><label class="field-label">Instructions</label><input class="field-input" id="nrInstr" placeholder="e.g. Rinse 10ml twice daily for 14 days"></div>' +
    '<div class="field-group"><label class="field-label">Notes to patient (optional)</label><input class="field-input" id="nrNotes"></div>',
    async ov => {
      const med = ov.querySelector('#nrMed').value.trim(), instr = ov.querySelector('#nrInstr').value.trim();
      if (!med || !instr) { toast('Medication and instructions are required', 'err'); return false; }
      const res = await DentinAPI.createPrescription({
        patientId: Number(ov.querySelector('#nrPatient').value),
        dentistId: Number(ov.querySelector('#nrDentist').value),
        diagnosis: ov.querySelector('#nrDiag').value.trim() || null,
        medicationDetails: med, instructions: instr,
        notesToPatient: ov.querySelector('#nrNotes').value.trim() || null,
      });
      if (!res.success) { toast(res.message, 'err'); return false; }
      DentinAPI.clearCaches();
      toast('Prescription sent', 'ok'); renderAdmin();
    }, 'Send Prescription');
}

const adminPanel = $('#adminPanel');
if (adminPanel) adminPanel.addEventListener('click', async e => {
  const del = e.target.closest('[data-del-kind]');
  if (!del) return;
  await adminDelete(del.dataset.delKind, Number(del.dataset.delId), del.dataset.delLabel || 'this data');
});

/* ---------- Overview tab ---------- */
async function adminOverviewHTML(d) {
  const recentAppts = [...d.appts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentScans = [...d.scans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const row = (t, s) => '<div class="status-row"><div class="status-ico" style="background:rgba(47,128,237,.1);">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F80ED" stroke-width="2.2"><path d="M5 12l4 4 10-10"/></svg></div>' +
      '<div class="status-txt"><div class="t1">' + t + '</div><div class="t2">' + s + '</div></div></div>';

  let apptRows = '';
  for (const a of recentAppts) {
    const pName = await adminPatientName(a.patientId);
    const dName = await adminDentistName(a.dentistId);
    apptRows += row(pName + ' \u2192 ' + dName, fmtApptDate(a.appointmentDate) + ' \u00b7 ' + a.appointmentTime + ' \u00b7 ' + a.status);
  }

  let scanRows = '';
  for (const s of recentScans) {
    const pName = await adminPatientName(s.patientId);
    const analysis = parseAnalysis(s);
    scanRows += row(pName, s.status === 'COMPLETED' && analysis ? 'Score ' + analysis.overall_health_score + '/100' : 'Awaiting analysis');
  }

  return '<p class="ec-sub" style="text-align:left;margin:0 0 16px;">Summary across all data. Add &amp; delete from each tab (Appointments, Patients, Dentists, AI Scans, Prescriptions).</p>' +
  '<div class="dash-grid" style="padding:0;">' +
    '<div class="card col-7"><div class="card-head"><div class="card-label">Recent Appointments</div></div>' +
      (apptRows || '<div class="dt-empty">No appointments recorded yet.</div>') + '</div>' +
    '<div class="card col-5"><div class="card-head"><div class="card-label">Recent AI Scans</div></div>' +
      (scanRows || '<div class="dt-empty">No scans uploaded yet.</div>') + '</div>' +
    '<div class="card col-12"><div class="card-head"><div class="card-label">All Prescriptions</div></div>' +
      (d.pres.length ? d.pres.slice(0, 6).map(p =>
        '<div class="status-row"><div class="status-ico" style="background:rgba(47,128,237,.1);">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F80ED" stroke-width="2.2"><path d="M5 12l4 4 10-10"/></svg></div>' +
          '<div class="status-txt"><div class="t1">' + p.medicationDetails + '</div>' +
          '<div class="t2">' + p.instructions + '</div></div></div>'
      ).join('') : '<div class="dt-empty">No prescriptions yet.</div>') + '</div>' +
  '</div>';
}

/* ---------- Appointments tab ---------- */
async function adminAppointmentsHTML(d) {
  const list = [...d.appts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  let rows = '';
  for (const a of list) {
    rows += await apptRow(a);
  }
  return '<div class="admin-toolbar">' +
      '<div class="admin-search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
        '<input type="text" id="apptSearch" placeholder="Search patient or dentist\u2026"></div>' +
      '<button class="btn btn-primary" style="padding:9px 16px;font-size:13px;" onclick="adminAddAppointment()">+ Add Appointment</button>' +
    '</div>' +
    '<div class="table-card"><table class="data-table"><thead><tr>' +
      '<th>Patient</th><th>Dentist</th><th>Date &amp; Time</th><th>Status</th><th>Actions</th>' +
    '</tr></thead><tbody id="apptTbody">' + (rows || '<tr><td colspan="5" class="dt-empty">No appointments.</td></tr>') + '</tbody></table></div>';
}

async function apptRow(a) {
  const p = await DentinAPI.findPatient(a.patientId);
  const doc = await DentinAPI.findDentist(a.dentistId);
  const statusBtns = a.status === 'CANCELLED' || a.status === 'COMPLETED' ? '' :
    (a.status === 'SCHEDULED' ? '<button class="dt-btn ok" data-appt-action="confirm" data-id="' + a.id + '">Confirm</button>' : '') +
    (a.status === 'CONFIRMED' ? '<button class="dt-btn pri" data-appt-action="progress" data-id="' + a.id + '">Start</button>' : '') +
    (a.status === 'IN_PROGRESS' ? '<button class="dt-btn ok" data-appt-action="complete" data-id="' + a.id + '">Complete</button>' : '') +
    '<button class="dt-btn danger" data-appt-action="cancel" data-id="' + a.id + '">Cancel</button>';
  const actions = '<div class="dt-actions">' + statusBtns +
      '<button class="dt-btn danger" data-del-kind="appt" data-del-id="' + a.id + '" data-del-label="appointment for ' + (p ? p.fullName : '') + '">Delete</button></div>';
  return '<tr data-search="' + ((p ? p.fullName : '') + ' ' + (doc ? doc.fullName : '')) + '">' +
    '<td><div class="dt-person"><div class="dt-avatar">' + (p ? initials(p) : '?') + '</div>' +
      '<div><div class="dt-name">' + (p ? p.fullName : '\u2014') + '</div><div class="dt-sub">' + (p ? (p.phone || '') : '') + '</div></div></div></td>' +
    '<td><div class="dt-name">' + (doc ? doc.fullName : '\u2014') + '</div><div class="dt-sub">' + (doc ? (doc.specialization || '') : '') + '</div></td>' +
    '<td>' + fmtApptDate(a.appointmentDate) + ' \u00b7 ' + a.appointmentTime + '</td>' +
    '<td><span class="status-badge ' + a.status + '">' + a.status.replace('_', ' ') + '</span></td>' +
    '<td>' + actions + '</td></tr>';
}

async function wireAdminAppointments() {
  const body = $('#apptTbody');
  if (!body) return;
  body.addEventListener('click', async e => {
    const btn = e.target.closest('[data-appt-action]');
    if (!btn) return;
    const id = btn.dataset.id, action = btn.dataset.apptAction;
    const map = { confirm: 'CONFIRMED', progress: 'IN_PROGRESS', complete: 'COMPLETED' };
    const res = action === 'cancel' ? await DentinAPI.cancelAppointment(id) : await DentinAPI.updateAppointmentStatus(id, map[action]);
    if (!res.success) { toast(res.message, 'err'); return; }
    toast('Appointment status updated', 'ok'); renderAdmin();
  });
  const search = $('#apptSearch');
  if (search) search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    $$('#apptTbody tr').forEach(tr => tr.style.display = (tr.dataset.search || '').toLowerCase().includes(q) ? '' : 'none');
  });
}

/* ---------- Patients tab ---------- */
async function adminPatientsHTML(d) {
  const list = d.patients;
  let rows = '';
  for (const p of list) {
    const apptCount = d.appts.filter(a => a.patientId === p.id && a.status !== 'CANCELLED').length;
    const scanCount = d.scans.filter(s => s.patientId === p.id).length;
    const created = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014';
    rows += '<tr data-search="' + p.fullName + ' ' + p.email + '">' +
      '<td><div class="dt-person"><div class="dt-avatar">' + initials(p) + '</div>' +
        '<div><div class="dt-name">' + p.fullName + '</div><div class="dt-sub">' + p.email + '</div></div></div></td>' +
      '<td>' + (p.phone || '\u2014') + '</td><td>' + (p.gender || '\u2014') + '</td>' +
      '<td>' + apptCount + ' appointments</td><td>' + scanCount + ' scans</td>' +
      '<td>' + created + '</td>' +
      '<td><button class="dt-btn danger" data-del-kind="patient" data-del-id="' + p.id + '" data-del-label="patient ' + p.fullName + '">Delete</button></td></tr>';
  }
  return '<div class="admin-toolbar">' +
      '<div class="admin-search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
        '<input type="text" id="patientSearch" placeholder="Search name or email\u2026"></div>' +
      '<button class="btn btn-primary" style="padding:9px 16px;font-size:13px;" onclick="adminAddPatient()">+ Add Patient</button>' +
    '</div>' +
    '<div class="table-card"><table class="data-table"><thead><tr>' +
      '<th>Patient</th><th>Phone</th><th>Gender</th><th>History</th><th>Scans</th><th>Registered</th><th>Actions</th>' +
    '</tr></thead><tbody id="patientTbody">' + (rows || '<tr><td colspan="7" class="dt-empty">No patients yet. Add via the button above or through patient registration.</td></tr>') + '</tbody></table></div>';
}

/* ---------- Dentists tab ---------- */
async function adminDentistsHTML(d) {
  const rows = d.dentists.map(doc =>
    '<tr data-search="' + doc.fullName + ' ' + doc.specialization + '">' +
      '<td><div class="dt-person"><div class="dt-avatar" style="background:linear-gradient(135deg,#' + (doc.colorHex || doc.color || '2F80ED') + ',#1B63C7);">' + (doc.initials || '') + '</div>' +
        '<div><div class="dt-name">' + doc.fullName + '</div><div class="dt-sub">' + doc.specialization + '</div></div></div></td>' +
      '<td>' + (doc.rating || '-') + ' \u2605 (' + (doc.reviewsCount || doc.reviews || 0) + ')</td><td>' + (doc.experience || '') + '</td>' +
      '<td><span class="status-badge ' + (doc.active !== false ? 'active-yes' : 'active-no') + '">' + (doc.active !== false ? 'Active' : 'Inactive') + '</span></td>' +
      '<td><div class="toggle-switch ' + (doc.active !== false ? 'on' : '') + '" data-dentist-toggle="' + doc.id + '" role="button" aria-label="Toggle status ' + doc.fullName + '"></div></td>' +
      '<td><button class="dt-btn danger" data-del-kind="dentist" data-del-id="' + doc.id + '" data-del-label="dentist ' + doc.fullName + '">Delete</button></td></tr>'
  ).join('');
  return '<div class="admin-toolbar">' +
      '<div class="admin-search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
        '<input type="text" id="dentistSearch" placeholder="Search name or specialization\u2026"></div>' +
      '<button class="btn btn-primary" style="padding:9px 16px;font-size:13px;" onclick="adminAddDentist()">+ Add Dentist</button>' +
    '</div>' +
    '<div class="table-card"><table class="data-table"><thead><tr>' +
      '<th>Dentist</th><th>Rating</th><th>Experience</th><th>Status</th><th>Toggle</th><th>Actions</th>' +
    '</tr></thead><tbody id="dentistTbody">' + (rows || '<tr><td colspan="6" class="dt-empty">No dentists.</td></tr>') + '</tbody></table></div>';
}

function wireAdminDentists() {
  const tbody = $('#dentistTbody');
  if (tbody) tbody.addEventListener('click', async e => {
    const t = e.target.closest('[data-dentist-toggle]');
    if (!t) return;
    const id = Number(t.dataset.dentistToggle);
    const isOn = t.classList.contains('on');
    const res = await DentinAPI.setDentistActive(id, !isOn);
    if (!res.success) { toast(res.message, 'err'); return; }
    toast(!isOn ? 'Dentist activated' : 'Dentist deactivated', 'ok');
    DentinAPI.clearCaches();
    renderAdmin();
  });
  wireAdminSearch('dentists');
}

/* ---------- Scans tab ---------- */
async function adminScansHTML(d) {
  const list = [...d.scans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  let rows = '';
  for (const s of list) {
    const p = await DentinAPI.findPatient(s.patientId);
    const pName = p ? p.fullName : 'Patient #' + s.patientId;
    const pInitials = p ? initials(p) : '?';
    const analysis = parseAnalysis(s);
    const scoreCol = s.status === 'COMPLETED' && analysis
      ? '<div class="admin-score"><span class="dot" style="background:' + (analysis.overall_health_score >= 80 ? '#00C896' : analysis.overall_health_score >= 60 ? '#F2C94C' : '#EB5757') + ';"></span>' + analysis.overall_health_score + '/100</div>'
      : '\u2014';
    const created = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
    rows += '<tr>' +
      '<td><div class="dt-person"><div class="dt-avatar">' + pInitials + '</div>' +
        '<div><div class="dt-name">' + pName + '</div>' +
        '<div class="dt-sub">' + created + '</div></div></div></td>' +
      '<td><span class="status-badge ' + s.status + '">' + s.status + '</span></td>' +
      '<td>' + scoreCol + '</td>' +
      '<td>' + (s.status === 'COMPLETED' ? (s.detectedIssues || '\u2014') : '\u2014') + '</td>' +
      '<td><div class="dt-actions">' +
        (s.status !== 'COMPLETED' ? '<button class="dt-btn pri" data-analyze="' + s.id + '">Run AI Analysis</button>' : '<span class="dt-sub">Analysed</span>') +
        '<button class="dt-btn danger" data-del-kind="scan" data-del-id="' + s.id + '" data-del-label="scan for ' + pName + '">Delete</button>' +
      '</div></td></tr>';
  }
  return '<div class="admin-toolbar">' +
      '<div class="admin-search" style="visibility:hidden;"></div>' +
      '<button class="btn btn-primary" style="padding:9px 16px;font-size:13px;" onclick="adminAddScan()">+ Add Scan</button>' +
    '</div>' +
    '<div class="table-card"><table class="data-table"><thead><tr>' +
      '<th>Patient</th><th>Status</th><th>Health Score</th><th>Findings</th><th>Actions</th>' +
    '</tr></thead><tbody id="scanTbody">' + (rows || '<tr><td colspan="5" class="dt-empty">No dental scans.</td></tr>') + '</tbody></table></div>';
}

function wireAdminScans() {
  const tbody = $('#scanTbody');
  if (tbody) tbody.addEventListener('click', async e => {
    const btn = e.target.closest('[data-analyze]');
    if (!btn) return;
    btn.disabled = true; btn.textContent = 'Analysing\u2026';
    const res = await DentinAPI.analyzeScan(btn.dataset.analyze);
    if (!res.success) { toast(res.message, 'err'); return; }
    const analysis = parseAnalysis(res.data);
    toast('AI analysis complete \u2014 score ' + (analysis ? analysis.overall_health_score : ''), 'ok');
    renderAdmin();
  });
}

/* ---------- Prescriptions tab ---------- */
async function adminPrescriptionsHTML(d) {
  const list = [...d.pres].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  let rows = '';
  for (const p of list) {
    const pat = await DentinAPI.findPatient(p.patientId);
    const den = await DentinAPI.findDentist(p.dentistId);
    const pName = pat ? pat.fullName : 'Patient #' + p.patientId;
    const dName = den ? den.fullName : (p.dentistId ? 'Dentist #' + p.dentistId : '\u2014');
    const pInitials = pat ? initials(pat) : '?';
    rows += '<tr>' +
      '<td><div class="dt-person"><div class="dt-avatar">' + pInitials + '</div>' +
        '<div><div class="dt-name">' + pName + '</div><div class="dt-sub">by ' + dName + '</div></div></div></td>' +
      '<td>' + (p.medicationDetails || '') + '</td><td>' + (p.instructions || '') + '</td>' +
      '<td>' + (p.prescriptionDate || '') + '</td>' +
      '<td>\u2014</td>' +
      '<td><button class="dt-btn danger" data-del-kind="pres" data-del-id="' + p.id + '" data-del-label="prescription for ' + pName + '">Delete</button></td></tr>';
  }
  return '<div class="admin-toolbar">' +
      '<div class="admin-search" style="visibility:hidden;"></div>' +
      '<button class="btn btn-primary" style="padding:9px 16px;font-size:13px;" onclick="adminAddPrescription()">+ Add Prescription</button>' +
    '</div>' +
    '<div class="table-card"><table class="data-table"><thead><tr>' +
      '<th>Patient</th><th>Medication</th><th>Instructions</th><th>Date</th><th>Adherence</th><th>Actions</th>' +
    '</tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="dt-empty">No prescriptions. Add via the button above.</td></tr>') + '</tbody></table></div>';
}

/* ---------- Shared search-filter wiring ---------- */
function wireAdminSearch(kind) {
  const ids = { patients: ['patientSearch', 'patientTbody'], dentists: ['dentistSearch', 'dentistTbody'] };
  const [inputId, bodyId] = ids[kind] || [];
  const input = inputId && $('#' + inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    $$('#' + bodyId + ' tr').forEach(tr => tr.style.display = (tr.dataset.search || '').toLowerCase().includes(q) ? '' : 'none');
  });
}

/* ============================= 10. API CONSOLE ========================== */
function renderApiConsole() {
  const log = DentinAPI.getLog();
  const cnt = $('#apiCount');
  if (cnt) cnt.textContent = log.length;
  const body = $('#apiLogBody');
  if (!body) return;
  body.innerHTML = log.length
    ? log.map(e => '<div class="api-row"><span class="api-m ' + e.method + '">' + e.method + '</span>' +
        '<span class="api-path">' + e.path + '<span class="api-msg ' + (e.ok ? 'api-ok' : 'api-err') + '">' + (e.ok ? '200 \u00b7 ' : 'ERR \u00b7 ') + e.message + '</span></span></div>').join('')
    : '<div class="api-empty">No calls yet. Register, book a doctor, or run a scan \u2014 every action hits the REST API and shows up here.</div>';
}

/* ================================ 11. BOOT ============================= */
document.addEventListener('DOMContentLoaded', () => {
  bindLogin();
  bindRegister();
  DentinAPI.onLog(renderApiConsole);
  renderApiConsole();
  const fab = $('#apiFab'); if (fab) fab.onclick = () => { $('#apiDrawer').classList.toggle('open'); renderApiConsole(); };
  const close = $('#apiClose'); if (close) close.onclick = () => $('#apiDrawer').classList.remove('open');
  const clear = $('#apiClear'); if (clear) clear.onclick = () => DentinAPI.clearLog();
  if (!location.hash) location.hash = '#/home';
  route();
});
