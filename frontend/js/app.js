// ============================================================
//  AutoCare Pro – Main Application  (v2)
// ============================================================

let currentUser = JSON.parse(localStorage.getItem("autocare_user")) || null;
const wizardState = { vehicleId: null, serviceId: null, date: null, slot: null };

// Local store to cache data from API
const store = {
  vehicles: [],
  services: [],
  bookings: [],
  notifications: [],
  centers: [],
  users: [] // for admin view
};

// Sync store with API
async function syncStore(userId = null) {
  try {
    const [vehicles, services, bookings, notifications, centers] = await Promise.all([
      userId ? API.getVehicles(userId) : Promise.resolve([]),
      API.getServices(),
      API.getBookings(userId),
      userId ? API.getNotifications(userId) : Promise.resolve([]),
      API.getCenters()
    ]);

    store.vehicles = vehicles;
    store.services = services;
    store.bookings = bookings;
    store.notifications = notifications;
    store.centers = centers;

    // Update legacy DB helpers to use store (optional but helpful for minimal changes)
    if (typeof DB !== 'undefined') {
      DB.vehicles = store.vehicles;
      DB.services = store.services;
      DB.bookings = store.bookings;
      DB.notifications = store.notifications;
      DB.centers = store.centers;
    }
  } catch (err) {
    console.error('Failed to sync store:', err);
  }
}

// ── AUTH ────────────────────────────────────────────────────

function switchAuthTab(tab) {
  ['login', 'register'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`form-${t}`).classList.toggle('active', t === tab);
  });
}

function fillDemo(role) {
  const creds = { owner: ['owner@demo.com', 'demo123'], admin: ['admin@demo.com', 'demo123'] };
  document.getElementById('login-email').value = creds[role][0];
  document.getElementById('login-password').value = creds[role][1];
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value.trim();
  if (!email || !pass) { showToast('Please enter email and password.', 'error'); return; }

  try {
    const user = await API.login(email, pass);
    currentUser = user;
    localStorage.setItem("autocare_user", JSON.stringify(user));
    loadApp();
    showToast(`Welcome back, ${user.name}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value.trim();
  const role = document.getElementById('reg-role').value;

  if (!name || !email || !pass) { showToast('Please fill all fields.', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }

  try {
    await API.register({ name, email, password: pass, role });
    showToast('Account created! Please sign in.', 'success');
    switchAuthTab('login');
    document.getElementById('login-email').value = email;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("autocare_user");
  Object.assign(wizardState, { vehicleId: null, serviceId: null, date: null, slot: null });
  showScreen('auth-screen');
  showToast('Logged out successfully.', 'info');
}

async function loadApp() {
  await syncStore(currentUser.role === 'owner' ? currentUser.id : null);

  if (currentUser.role === 'owner') {
    loadOwnerDashboard(); showScreen('owner-screen');
    ownerNav('dashboard', document.getElementById('onav-dashboard'));
  } else {
    loadAdminDashboard(); showScreen('admin-screen');
    adminNav('dashboard', document.getElementById('anav-dashboard'));
  }
}

// ── NAVIGATION ───────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function ownerNav(section, el) {
  document.querySelectorAll('#owner-sidebar .nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('#owner-screen .panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`panel-${section}`);
  if (panel) panel.classList.add('active');
  const loaders = {
    dashboard: 'renderOwnerDashboard', vehicles: 'renderVehicles',
    booking: 'initBookingWizard', bookings: () => renderBookings('all'),
    history: 'renderHistory', notifications: 'renderNotifications', profile: 'renderProfile'
  };
  const fn = loaders[section];
  if (typeof fn === 'string' && window[fn]) window[fn]();
  else if (typeof fn === 'function') fn();
  closeSidebar();
}

function adminNav(section, el) {
  document.querySelectorAll('#admin-sidebar .nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('#admin-screen .panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`apanel-${section}`);
  if (panel) panel.classList.add('active');
  const loaders = {
    dashboard: 'renderAdminDashboard', bookings: () => renderAdminBookings('all'),
    services: 'renderAdminServices', centers: 'renderAdminCenters', analytics: 'renderAnalytics'
  };
  const fn = loaders[section];
  if (typeof fn === 'string' && window[fn]) window[fn]();
  else if (typeof fn === 'function') fn();
  closeSidebar();
}

function toggleSidebar() { document.querySelector('.sidebar').classList.toggle('open'); }
function closeSidebar() { if (window.innerWidth <= 768) document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open')); }

// ── OWNER DASHBOARD ──────────────────────────────────────────

function loadOwnerDashboard() {
  const av = document.getElementById('owner-avatar-sm');
  av.textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('owner-name-sidebar').textContent = currentUser.name;
  updateNotifBadge();
}

function updateNotifBadge() {
  const unread = getUserNotifications(currentUser.id).filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  badge.textContent = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
}

async function renderOwnerDashboard() {
  await syncStore(currentUser.id);
  document.getElementById('owner-greeting-name').textContent = currentUser.name.split(' ')[0];
  const userVehicles = store.vehicles;
  const userBookings = store.bookings;
  const active = userBookings.filter(b => ['Requested', 'Approved', 'In Service'].includes(b.status)).length;
  const completed = userBookings.filter(b => b.status === 'Completed').length;
  const spent = calcRevenue(userBookings);

  document.getElementById('owner-stats').innerHTML = `
    <div class="stat-card" style="--stat-accent:var(--indigo)">
      <div class="stat-icon">🚗</div>
      <div class="stat-value">${userVehicles.length}</div>
      <div class="stat-label">Registered Vehicles</div>
    </div>
    <div class="stat-card" style="--stat-accent:var(--amber)">
      <div class="stat-icon">📅</div>
      <div class="stat-value">${active}</div>
      <div class="stat-label">Active Bookings</div>
    </div>
    <div class="stat-card" style="--stat-accent:var(--emerald)">
      <div class="stat-icon">✅</div>
      <div class="stat-value">${completed}</div>
      <div class="stat-label">Completed Services</div>
    </div>
    <div class="stat-card" style="--stat-accent:var(--violet)">
      <div class="stat-icon">💸</div>
      <div class="stat-value">₹${spent.toLocaleString()}</div>
      <div class="stat-label">Total Spent (incl. GST)</div>
    </div>`;

  const recentEl = document.getElementById('recent-bookings-list');
  const recent = [...userBookings].reverse().slice(0, 5);
  if (!recent.length) { recentEl.innerHTML = emptyState('📅', 'No bookings yet', 'Book your first service!'); return; }
  recentEl.innerHTML = recent.map(b => {
    const v = getVehicleById(b.vehicleId), s = getServiceById(b.serviceId);
    return `<div class="recent-booking-mini">
          <span class="rbm-icon">${vehicleIcon(v?.type)}</span>
          <div class="rbm-info">
            <div class="rbm-service">${s?.name}</div>
            <div class="rbm-date">${v?.model} · ${formatDate(b.date)} · ${b.slot}</div>
          </div>
          <span class="status-badge ${statusClass(b.status)}"><span class="status-dot"></span>${b.status}</span>
        </div>`;
  }).join('');
}

// ── VEHICLES ─────────────────────────────────────────────────

async function renderVehicles() {
  await syncStore(currentUser.id);
  const list = store.vehicles;
  const grid = document.getElementById('vehicles-grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${emptyState('🚗', 'No vehicles registered', 'Add your first vehicle to start booking services')}</div>`;
    return;
  }
  grid.innerHTML = list.map(v => `
    <div class="vehicle-card" id="vc-${v.id}">
      <div class="vehicle-type-icon">${vehicleIcon(v.type)}</div>
      <div class="vehicle-model">${v.model}</div>
      <div class="vehicle-reg">${v.reg_number}</div>
      <div class="vehicle-meta">
        <span class="vehicle-tag tag-${v.type.toLowerCase()}">${v.type}</span>
        <span class="vehicle-tag" style="background:rgba(255,255,255,0.07);color:var(--text-muted)">${v.year}</span>
        ${v.color ? `<span class="vehicle-tag" style="background:rgba(255,255,255,0.07);color:var(--text-muted)">🎨 ${v.color}</span>` : ''}
      </div>
      <div class="vehicle-actions">
        <button class="btn btn-sm btn-primary"  onclick="bookForVehicle('${v.id}')">Book Service</button>
        <button class="btn btn-sm btn-ghost"    onclick="openEditVehicle('${v.id}')">Edit</button>
        <button class="btn btn-sm btn-danger"   onclick="deleteVehicle('${v.id}')">Remove</button>
      </div>
    </div>`).join('');
}

async function addVehicle() {
  const type = document.getElementById('v-type').value;
  const model = document.getElementById('v-model').value.trim();
  const regNumber = document.getElementById('v-reg').value.trim();
  const year = document.getElementById('v-year').value;
  const color = document.getElementById('v-color').value.trim();

  if (!model || !regNumber) { showToast('Please fill all fields.', 'error'); return; }

  try {
    await API.addVehicle({
      user_id: currentUser.id,
      type,
      model,
      reg_number: regNumber,
      year: parseInt(year) || 2024,
      color
    });

    closeModal('add-vehicle-modal');
    renderVehicles();
    showToast(`${model} added successfully!`, 'success');
    ['v-model', 'v-reg', 'v-year', 'v-color'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEditVehicle(id) {
  const v = getVehicleById(id);
  if (!v) return;
  document.getElementById('ev-id').value = v.id;
  document.getElementById('ev-type').value = v.type;
  document.getElementById('ev-model').value = v.model;
  document.getElementById('ev-reg').value = v.regNumber;
  document.getElementById('ev-year').value = v.year;
  document.getElementById('ev-color').value = v.color || '';
  openModal('edit-vehicle-modal');
}

function saveEditVehicle() {
  const id = document.getElementById('ev-id').value;
  const v = getVehicleById(id);
  if (!v) return;
  v.type = document.getElementById('ev-type').value;
  v.model = document.getElementById('ev-model').value.trim();
  v.regNumber = document.getElementById('ev-reg').value.trim();
  v.year = parseInt(document.getElementById('ev-year').value) || v.year;
  v.color = document.getElementById('ev-color').value.trim();
  closeModal('edit-vehicle-modal');
  renderVehicles();
  showToast('Vehicle updated!', 'success');
}

async function deleteVehicle(id) {
  if (!confirm('Remove this vehicle? This action cannot be undone.')) return;
  try {
    await API.deleteVehicle(id);
    renderVehicles();
    showToast('Vehicle removed.', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function bookForVehicle(id) {
  wizardState.vehicleId = id;
  ownerNav('booking', document.getElementById('onav-booking'));
}

// ── BOOKING WIZARD ───────────────────────────────────────────

function initBookingWizard() {
  wizardState.serviceId = null; wizardState.date = null; wizardState.slot = null;
  setWizardStep(1);
  const userVehicles = getVehiclesByUser(currentUser.id);
  const grid = document.getElementById('vehicle-select-grid');
  if (!userVehicles.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${emptyState('🚗', 'No vehicles found', 'Add a vehicle first from My Vehicles')}</div>`;
    return;
  }
  grid.innerHTML = userVehicles.map(v => `
    <div class="vehicle-select-card ${wizardState.vehicleId === v.id ? 'selected' : ''}" onclick="selectWizardVehicle('${v.id}',this)">
      <span class="vsc-icon">${vehicleIcon(v.type)}</span>
      <div class="vsc-model">${v.model}</div>
      <div class="vsc-reg">${v.regNumber}</div>
    </div>`).join('');
  document.getElementById('btn-step1-next').disabled = !wizardState.vehicleId;
}

function selectWizardVehicle(id, el) {
  wizardState.vehicleId = id;
  document.querySelectorAll('.vehicle-select-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btn-step1-next').disabled = false;
}

function renderServicesStep() {
  const grid = document.getElementById('services-select-grid');
  grid.innerHTML = DB.services.map(s => `
    <div class="service-card ${wizardState.serviceId === s.id ? 'selected' : ''}" onclick="selectWizardService('${s.id}',this)">
      ${categoryBadge(s.category)}
      <div class="service-name">${s.name}</div>
      <div class="service-desc">${s.description}</div>
      <div class="service-footer">
        <span class="service-price">₹${s.price.toLocaleString()}</span>
        <span class="service-duration">⏱ ${s.duration}</span>
      </div>
    </div>`).join('');
  document.getElementById('btn-step2-next').disabled = !wizardState.serviceId;
}

function selectWizardService(id, el) {
  wizardState.serviceId = id;
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btn-step2-next').disabled = false;
}

function generateTimeSlots() {
  const date = document.getElementById('booking-date').value;
  wizardState.date = date;
  wizardState.slot = null;

  document.getElementById('btn-step3-next').disabled = true;

  const slots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
    '5:00 PM', '6:00 PM'
  ];

  const booked = DB.bookings
    .filter(b => b.date === date && !['Cancelled'].includes(b.status))
    .map(b => b.slot);

  const el = document.getElementById('time-slots-grid');

  if (!date) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem">Please select a date first</p>';
    return;
  }

  el.innerHTML = slots.map(slot => {
    const isBooked = booked.includes(slot);

    return `
      <div class="time-slot ${isBooked ? 'booked' : ''}"
           ${isBooked ? '' : `onclick="selectSlot('${slot}', this)"`}>
           ${slot}
           ${isBooked ? '<span class="slot-full">Full</span>' : ''}
      </div>
    `;
  }).join('');
}

function selectSlot(slot, el) {
  wizardState.slot = slot;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btn-step3-next').disabled = false;
}

function renderBookingSummary() {
  const v = getVehicleById(wizardState.vehicleId);
  const s = getServiceById(wizardState.serviceId);
  const tax = Math.round(s.price * 0.18), total = s.price + tax;
  document.getElementById('booking-summary').innerHTML = `
    <div class="summary-row"><span class="summary-label">Vehicle</span><span class="summary-value">${vehicleIcon(v?.type)} ${v?.model}</span></div>
    <div class="summary-row"><span class="summary-label">Registration</span><span class="summary-value">${v?.regNumber}</span></div>
    <div class="summary-row"><span class="summary-label">Service</span><span class="summary-value">${s?.name}</span></div>
    <div class="summary-row"><span class="summary-label">Category</span><span class="summary-value">${categoryBadge(s?.category)}</span></div>
    <div class="summary-row"><span class="summary-label">Date</span><span class="summary-value">${formatDate(wizardState.date)}</span></div>
    <div class="summary-row"><span class="summary-label">Time Slot</span><span class="summary-value">⏰ ${wizardState.slot}</span></div>
    <div class="summary-row"><span class="summary-label">Duration</span><span class="summary-value">⏱ ${s?.duration}</span></div>
    <div class="summary-row"><span class="summary-label">Service Price</span><span class="summary-value">₹${s?.price?.toLocaleString()}</span></div>
    <div class="summary-row"><span class="summary-label">GST (18%)</span><span class="summary-value">₹${tax.toLocaleString()}</span></div>
    <div class="summary-row summary-total"><span class="summary-label">Total Amount</span><span class="summary-value">₹${total.toLocaleString()}</span></div>`;
}

function wizardNext(step) {
  if (step === 1) { setWizardStep(2); renderServicesStep(); }
  else if (step === 2) { setWizardStep(3); const today = new Date().toISOString().split('T')[0]; document.getElementById('booking-date').min = today; generateTimeSlots(); }
  else if (step === 3) { setWizardStep(4); renderBookingSummary(); }
}

function wizardBack(step) {
  setWizardStep(step - 1);
  if (step - 1 === 1) initBookingWizard();
  if (step - 1 === 2) renderServicesStep();
}

function setWizardStep(num) {
  document.querySelectorAll('.wizard-panel').forEach((p, i) => p.classList.toggle('active', i + 1 === num));
  document.querySelectorAll('.wizard-step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 === num) s.classList.add('active');
    else if (i + 1 < num) s.classList.add('done');
  });
}

async function confirmBooking() {
  if (!wizardState.vehicleId || !wizardState.serviceId || !wizardState.date || !wizardState.slot) {
    showToast('Please complete all steps.', 'error'); return;
  }

  try {
    const booking = await API.addBooking({
      user_id: currentUser.id,
      vehicle_id: parseInt(wizardState.vehicleId),
      service_id: parseInt(wizardState.serviceId),
      date: wizardState.date,
      slot: wizardState.slot,
      status: 'Requested'
    });

    const s = getServiceById(wizardState.serviceId), v = getVehicleById(wizardState.vehicleId);

    await API.addNotification({
      user_id: currentUser.id,
      icon: '🎉',
      title: 'Booking Confirmed!',
      message: `${s.name} for ${v.model} scheduled on ${formatDate(wizardState.date)} at ${wizardState.slot}.`,
      read: false
    });

    await syncStore(currentUser.id);
    updateNotifBadge();
    showToast('Booking confirmed! Awaiting approval.', 'success');
    Object.assign(wizardState, { vehicleId: null, serviceId: null, date: null, slot: null });
    ownerNav('bookings', document.getElementById('onav-bookings'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── BOOKINGS LIST ────────────────────────────────────────────

let currentBookingFilter = 'all', bookingSearchQuery = '';

async function renderBookings(filter) {
  currentBookingFilter = filter;
  await syncStore(currentUser.id);
  let list = store.bookings;

  if (filter !== 'all') list = list.filter(b => b.status === filter);
  if (bookingSearchQuery) {
    const q = bookingSearchQuery.toLowerCase();
    list = list.filter(b => {
      const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id);
      return v?.model.toLowerCase().includes(q) || s?.name.toLowerCase().includes(q) || String(b.id).toLowerCase().includes(q);
    });
  }
  list = [...list].reverse();
  const el = document.getElementById('bookings-list');
  if (!list.length) { el.innerHTML = emptyState('🔖', 'No bookings found', filter === 'all' ? 'Book your first service above' : `No ${filter} bookings`); return; }
  el.innerHTML = list.map(b => {
    const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id);
    const canCancel = ['Requested', 'Approved'].includes(b.status);
    const needsReview = b.status === 'Completed' && !b.rating;
    return `<div class="booking-item">
          <div class="booking-item-icon">${vehicleIcon(v?.type)}</div>
          <div class="booking-info">
            <div class="booking-service-name">${s?.name}</div>
            <div style="color:var(--text-muted);font-size:0.82rem;margin-top:2px">${v?.model} · ${v?.reg_number}</div>
            <div class="booking-meta">
              <span>📅 ${formatDate(b.date)}</span><span>⏰ ${b.slot}</span><span>💰 ₹${s?.price?.toLocaleString()}</span>
              <span style="font-family:monospace;font-size:0.72rem;color:var(--text-muted)">#${b.id}</span>
            </div>
            ${b.rating ? `<div class="booking-rating">⭐ ${starRating(b.rating)} <span style="font-size:0.72rem;color:var(--text-muted)">${b.review}</span></div>` : ''}
          </div>
          <div class="booking-actions">
            <span class="status-badge ${statusClass(b.status)}"><span class="status-dot"></span>${b.status}</span>
            ${b.status === 'Completed' ? `<button class="btn btn-sm btn-success" onclick="viewInvoice('${b.id}')">📄 Invoice</button>` : ''}
            ${needsReview ? `<button class="btn btn-sm btn-ghost" onclick="openRatingModal('${b.id}')">⭐ Rate</button>` : ''}
            ${canCancel ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.id}')">Cancel</button>` : ''}
          </div>
        </div>`;
  }).join('');
}

function filterBookings(filter, el) {
  document.querySelectorAll('#panel-bookings .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderBookings(filter);
}

function searchBookings(q) {
  bookingSearchQuery = q;
  renderBookings(currentBookingFilter);
}

async function cancelBooking(id) {
  const b = getBookingById(id);
  if (!b) return;
  if (!confirm('Cancel this booking?')) return;

  try {
    await API.updateBooking(id, { status: 'Cancelled' });
    await API.addNotification({
      user_id: currentUser.id,
      icon: '❌',
      title: 'Booking Cancelled',
      message: `Your ${getServiceById(b.service_id)?.name} booking for ${formatDate(b.date)} has been cancelled.`,
      read: false
    });

    await syncStore(currentUser.id);
    updateNotifBadge();
    showToast('Booking cancelled.', 'info');
    renderBookings(currentBookingFilter);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── RATING / REVIEW ─────────────────────────────────────────

let _ratingBookingId = null, _selectedRating = 0;

function openRatingModal(bookingId) {
  _ratingBookingId = bookingId; _selectedRating = 0;
  renderStarPicker(0);
  document.getElementById('review-text').value = '';
  openModal('rating-modal');
}

function renderStarPicker(n) {
  _selectedRating = n;
  document.getElementById('star-picker').innerHTML = [1, 2, 3, 4, 5].map(i =>
    `<span class="star-pick ${i <= n ? 'filled' : ''}" onclick="renderStarPicker(${i})" onmouseover="hoverStar(${i})" onmouseout="renderStarPicker(${_selectedRating})">★</span>`
  ).join('');
}

function hoverStar(n) {
  document.querySelectorAll('.star-pick').forEach((s, i) => s.classList.toggle('filled', i < n));
}

async function submitRating() {
  if (!_selectedRating) { showToast('Please select a rating.', 'error'); return; }
  const b = getBookingById(_ratingBookingId);
  if (!b) return;

  try {
    await API.updateBooking(_ratingBookingId, {
      rating: _selectedRating,
      review: document.getElementById('review-text').value.trim() || ''
    });

    closeModal('rating-modal');
    showToast('Thank you for your review! ⭐', 'success');
    renderBookings(currentBookingFilter);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── SERVICE HISTORY ──────────────────────────────────────────

async function renderHistory() {
  await syncStore(currentUser.id);
  const completed = store.bookings.filter(b => b.status === 'Completed');
  const el = document.getElementById('history-list');
  if (!completed.length) { el.innerHTML = emptyState('📜', 'No service history yet', 'Completed services will appear here'); return; }
  const lastDate = new Date(completed[completed.length - 1].date);
  const nextDate = new Date(lastDate); nextDate.setMonth(nextDate.getMonth() + 3);
  el.innerHTML = `
    <div class="reminder-banner">
      <span class="reminder-icon">🔔</span>
      <div class="reminder-text">
        <div class="reminder-title">Next Service Reminder</div>
        <div class="reminder-date">Based on your last service, next service due around ${nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="ownerNav('booking',document.getElementById('onav-booking'))">Book Now</button>
    </div>
    ${[...completed].reverse().map(b => {
    const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id);
    const d = new Date(b.date + 'T00:00:00');
    const tax = Math.round(s?.price * 0.18), total = (s?.price || 0) + tax;
    return `<div class="history-item">
          <div class="history-date-block">
            <div class="history-date-day">${d.getDate()}</div>
            <div class="history-date-month">${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}</div>
          </div>
          <div>
            <div class="history-service-name">${s?.name}</div>
            <div class="history-meta">${vehicleIcon(v?.type)} ${v?.model} · ${v?.reg_number}</div>
            ${b.rating ? `<div class="booking-rating" style="margin-top:6px">⭐ ${starRating(b.rating)}</div>` : ''}
            <div class="history-actions">
              <button class="btn btn-sm btn-success" onclick="viewInvoice('${b.id}')">📄 Invoice</button>
              <button class="btn btn-sm btn-ghost"   onclick="rebookService('${b.vehicle_id}','${b.service_id}')">🔄 Rebook</button>
              ${!b.rating ? `<button class="btn btn-sm btn-ghost" onclick="openRatingModal('${b.id}')">⭐ Rate</button>` : ''}
            </div>
          </div>
          <div>
            <div class="history-amount">₹${total.toLocaleString()}</div>
            <span class="status-badge status-completed" style="margin-top:8px;display:inline-flex">✅ Completed</span>
          </div>
        </div>`;
  }).join('')}`;
}

function rebookService(vehicleId, serviceId) {
  wizardState.vehicleId = vehicleId; wizardState.serviceId = serviceId;
  ownerNav('booking', document.getElementById('onav-booking'));
}

// ── NOTIFICATIONS ────────────────────────────────────────────

async function renderNotifications() {
  await syncStore(currentUser.id);
  const notifs = store.notifications;
  const el = document.getElementById('notifications-list');
  if (!notifs.length) { el.innerHTML = emptyState('🔔', 'No notifications', 'You\'re all caught up!'); return; }
  el.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead('${n.id}')">
      <span class="notif-icon">${n.icon}</span>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${relativeTime(n.time)}</div>
      </div>
      ${!n.read ? '<div class="notif-dot"></div>' : ''}
    </div>`).join('');
}

async function markRead(id) {
  try {
    await API.markNotifRead(id);
    updateNotifBadge(); renderNotifications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function markAllRead() {
  try {
    const unread = store.notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => API.markNotifRead(n.id)));
    updateNotifBadge(); renderNotifications();
    showToast('All notifications marked as read.', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── PROFILE ──────────────────────────────────────────────────

function renderProfile() {
  const u = currentUser;
  document.getElementById('profile-panel-content').innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">${u.name.charAt(0).toUpperCase()}</div>
      <div class="profile-name">${u.name}</div>
      <div class="profile-email">${u.email}</div>
      <span class="status-badge ${u.role === 'admin' ? 'status-approved' : 'status-completed'}" style="margin-top:8px">
        ${u.role === 'admin' ? '🛠 Admin' : '🚗 Vehicle Owner'}
      </span>
    </div>
    <div class="card" style="margin-top:20px">
      <div class="card-header"><h3 class="card-title">Edit Profile</h3></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Full Name</label>
          <input type="text" id="prof-name" class="form-input" value="${u.name}"></div>
        <div class="form-group"><label class="form-label">Phone</label>
          <input type="text" id="prof-phone" class="form-input" value="${u.phone || ''}" placeholder="+91 98765 43210"></div>
        <div class="form-group"><label class="form-label">City</label>
          <input type="text" id="prof-city" class="form-input" value="${u.city || ''}" placeholder="Chennai"></div>
        <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
      </div>
    </div>`;
}

async function saveProfile() {
  const updates = {
    name: document.getElementById('prof-name').value.trim() || currentUser.name,
    phone: document.getElementById('prof-phone').value.trim(),
    city: document.getElementById('prof-city').value.trim()
  };

  try {
    const updatedUser = await API.updateProfile(currentUser.id, updates);
    currentUser = updatedUser;
    document.getElementById('owner-name-sidebar').textContent = currentUser.name;
    document.getElementById('owner-avatar-sm').textContent = currentUser.name.charAt(0).toUpperCase();
    showToast('Profile updated!', 'success');
    renderProfile();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── INVOICE ──────────────────────────────────────────────────

function viewInvoice(bookingId) {
  const b = getBookingById(bookingId); if (!b) return;
  const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id), user = getUserById(b.user_id);
  const tax = Math.round(s.price * 0.18), total = s.price + tax;
  const invNum = b.invoice_id || `INV-${new Date(b.created_at).getFullYear()}-${String(b.id).slice(-6).toUpperCase()}`;
  document.getElementById('invoice-body').innerHTML = `
    <div class="invoice">
      <div class="invoice-header">
        <div class="invoice-brand">🔧 AutoCare Pro</div>
        <div class="invoice-num">Invoice #${invNum}</div>
        <div class="invoice-num">Date: ${formatDate(b.date)}</div>
      </div>
      <hr class="invoice-divider"/>
      <div class="invoice-section">
        <div class="invoice-row"><span class="irow-key">Customer</span><span>${user?.name}</span></div>
        <div class="invoice-row"><span class="irow-key">Email</span><span>${user?.email}</span></div>
        ${user?.phone ? `<div class="invoice-row"><span class="irow-key">Phone</span><span>${user.phone}</span></div>` : ''}
      </div>
      <hr class="invoice-divider"/>
      <div class="invoice-section">
        <div class="invoice-row"><span class="irow-key">Vehicle</span><span>${vehicleIcon(v?.type)} ${v?.model}</span></div>
        <div class="invoice-row"><span class="irow-key">Reg. No.</span><span>${v?.reg_number}</span></div>
        <div class="invoice-row"><span class="irow-key">Service Date</span><span>${formatDate(b.date)}</span></div>
        <div class="invoice-row"><span class="irow-key">Time Slot</span><span>${b.slot}</span></div>
      </div>
      <hr class="invoice-divider"/>
      <div class="invoice-section">
        <div class="invoice-row"><span class="irow-key">Service</span><span>${s?.name}</span></div>
        <div class="invoice-row"><span class="irow-key">Category</span><span>${s?.category}</span></div>
        <div class="invoice-row"><span class="irow-key">Duration</span><span>${s?.duration}</span></div>
      </div>
      <hr class="invoice-divider"/>
      <div class="invoice-section">
        <div class="invoice-row"><span class="irow-key">Subtotal</span><span>₹${s?.price?.toLocaleString()}</span></div>
        <div class="invoice-row"><span class="irow-key">GST (18%)</span><span>₹${tax.toLocaleString()}</span></div>
        <div class="invoice-row total"><span class="irow-key">Total</span><span class="irow-value">₹${total.toLocaleString()}</span></div>
      </div>
      ${b.rating ? `<div class="invoice-section"><div class="invoice-row"><span class="irow-key">Rating</span><span>${starRating(b.rating)}</span></div></div>` : ''}
      <div class="invoice-footer">Thank you for choosing AutoCare Pro!<br/>This is a computer-generated invoice.</div>
    </div>`;
  openModal('invoice-modal');
}

function printInvoice() { window.print(); }

// ── ADMIN DASHBOARD ──────────────────────────────────────────

function loadAdminDashboard() {
  document.getElementById('admin-avatar-sm').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('admin-name-sidebar').textContent = currentUser.name;
}

async function renderAdminDashboard() {
  await syncStore();
  const total = store.bookings.length, pending = store.bookings.filter(b => b.status === 'Requested').length;
  const inSvc = store.bookings.filter(b => b.status === 'In Service').length;
  const done = store.bookings.filter(b => b.status === 'Completed').length;
  const revenue = calcRevenue(store.bookings);

  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-card" style="--stat-accent:var(--indigo)"><div class="stat-icon">🔖</div><div class="stat-value">${total}</div><div class="stat-label">Total Bookings</div></div>
    <div class="stat-card" style="--stat-accent:var(--amber)"><div class="stat-icon">⏳</div><div class="stat-value">${pending}</div><div class="stat-label">Pending Approval</div></div>
    <div class="stat-card" style="--stat-accent:var(--orange)"><div class="stat-icon">🔧</div><div class="stat-value">${inSvc}</div><div class="stat-label">In Service Now</div></div>
    <div class="stat-card" style="--stat-accent:var(--emerald)"><div class="stat-icon">💰</div><div class="stat-value">₹${revenue.toLocaleString()}</div><div class="stat-label">Total Revenue (GST)</div></div>`;

  document.getElementById('pending-count').textContent = pending;
  const pendingEl = document.getElementById('pending-approvals-list');
  const pendList = store.bookings.filter(b => b.status === 'Requested').slice(0, 5);
  if (!pendList.length) { pendingEl.innerHTML = `<div class="empty-state">${emptyState('✅', 'No pending approvals', 'All caught up!')}</div>`; }
  else pendingEl.innerHTML = pendList.map(b => {
    const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id), u = getUserById(b.user_id);
    return `<div class="recent-booking-mini">
          <span class="rbm-icon">${vehicleIcon(v?.type)}</span>
          <div class="rbm-info"><div class="rbm-service">${u?.name} – ${s?.name}</div><div class="rbm-date">${v?.model} · ${formatDate(b.date)}</div></div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-success" onclick="updateBookingStatus('${b.id}','Approved');renderAdminDashboard()">✓ Approve</button>
            <button class="btn btn-sm btn-danger"  onclick="updateBookingStatus('${b.id}','Cancelled');renderAdminDashboard()">✕</button>
          </div>
        </div>`;
  }).join('');

  const today = new Date().toISOString().split('T')[0];
  const todayEl = document.getElementById('todays-services-list');
  const todaySvc = store.bookings.filter(b => b.date === today);
  if (!todaySvc.length) { todayEl.innerHTML = `<div class="empty-state">${emptyState('📅', 'No services today', '')}</div>`; }
  else todayEl.innerHTML = todaySvc.map(b => {
    const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id);
    return `<div class="recent-booking-mini">
          <span class="rbm-icon">${vehicleIcon(v?.type)}</span>
          <div class="rbm-info"><div class="rbm-service">${s?.name}</div><div class="rbm-date">${v?.model} · ${b.slot}</div></div>
          <span class="status-badge ${statusClass(b.status)}">${b.status}</span>
        </div>`;
  }).join('');
}

// ── ADMIN BOOKINGS ───────────────────────────────────────────

let adminBookingFilter = 'all', adminSearchQuery = '';

async function renderAdminBookings(filter) {
  adminBookingFilter = filter;
  await syncStore();
  let list = filter === 'all' ? store.bookings : store.bookings.filter(b => b.status === filter);
  if (adminSearchQuery) {
    const q = adminSearchQuery.toLowerCase();
    list = list.filter(b => {
      const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id), u = getUserById(b.user_id);
      return v?.model.toLowerCase().includes(q) || s?.name.toLowerCase().includes(q) || u?.name.toLowerCase().includes(q) || String(b.id).toLowerCase().includes(q);
    });
  }
  list = [...list].reverse();
  const el = document.getElementById('admin-bookings-list');
  if (!list.length) { el.innerHTML = emptyState('🔖', 'No bookings found', ''); return; }
  el.innerHTML = list.map(b => {
    const v = getVehicleById(b.vehicle_id), s = getServiceById(b.service_id), u = getUserById(b.user_id);
    const next = getNextStatuses(b.status);
    return `<div class="admin-booking-item">
          <div class="abi-top">
            <div><div class="abi-title">${vehicleIcon(v?.type)} ${s?.name}</div><div style="color:var(--text-muted);font-size:0.78rem;margin-top:2px">Booking #${b.id}</div></div>
            <span class="status-badge ${statusClass(b.status)}"><span class="status-dot"></span>${b.status}</span>
          </div>
          <div class="abi-meta">
            <span>👤 ${u?.name}</span><span>${vehicleIcon(v?.type)} ${v?.model} (${v?.reg_number})</span>
            <span>📅 ${formatDate(b.date)}</span><span>⏰ ${b.slot}</span><span>💰 ₹${s?.price?.toLocaleString()}</span>
          </div>
          <div class="abi-actions">
            ${next.map(st => `<button class="btn btn-sm ${actionBtnClass(st)}" onclick="updateBookingStatus('${b.id}','${st}')">${statusIcon(st)} ${st}</button>`).join('')}
            ${b.status === 'Completed' ? `<button class="btn btn-sm btn-ghost" onclick="viewInvoice('${b.id}')">📄 Invoice</button>` : ''}
          </div>
        </div>`;
  }).join('');
}

function adminFilterBookings(filter, el) {
  document.querySelectorAll('#apanel-bookings .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); renderAdminBookings(filter);
}

function searchAdminBookings(q) { adminSearchQuery = q; renderAdminBookings(adminBookingFilter); }

function getNextStatuses(current) {
  return { 'Requested': ['Approved', 'Cancelled'], 'Approved': ['In Service', 'Cancelled'], 'In Service': ['Completed'], 'Completed': [], 'Cancelled': [] }[current] || [];
}
function actionBtnClass(s) { return { 'Approved': 'btn-success', 'In Service': 'btn-warning', 'Completed': 'btn-success', 'Cancelled': 'btn-danger' }[s] || 'btn-ghost'; }
function statusIcon(s) { return { 'Approved': '✓', 'In Service': '🔧', 'Completed': '✅', 'Cancelled': '✕' }[s] || ''; }

async function updateBookingStatus(id, status) {
  try {
    const updates = { status };
    if (status === 'Completed') updates.invoice_id = `INV-${new Date().getFullYear()}-${String(id).slice(-6).toUpperCase()}`;

    const b = getBookingById(id);
    await API.updateBooking(id, updates);

    const s = getServiceById(b.service_id), v = getVehicleById(b.vehicle_id);
    await API.addNotification({
      user_id: b.user_id,
      icon: { 'Approved': '✅', 'In Service': '🔧', 'Completed': '🎉', 'Cancelled': '❌' }[status] || '🔔',
      title: `Booking ${status}`,
      message: `Your ${s?.name} for ${v?.model} is now ${status}.`,
      read: false
    });

    showToast(`Booking updated to "${status}"`, 'success');
    renderAdminBookings(adminBookingFilter);
    if (document.getElementById('apanel-dashboard').classList.contains('active')) renderAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── ADMIN SERVICES ───────────────────────────────────────────

async function renderAdminServices() {
  await syncStore();
  document.getElementById('admin-services-grid').innerHTML = store.services.map(s => `
    <div class="admin-service-card">
      <div class="asc-header">${categoryBadge(s.category)}<span class="asc-price">₹${s.price.toLocaleString()}</span></div>
      <div class="asc-name">${s.name}</div>
      <div class="asc-desc">${s.description}</div>
      <div class="asc-footer">
        <span class="asc-duration">⏱ ${s.duration}</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-ghost" onclick="openEditService('${s.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteService('${s.id}')">Delete</button>
        </div>
      </div>
    </div>`).join('');
}

function addService() {
  const name = document.getElementById('s-name').value.trim();
  const price = document.getElementById('s-price').value;
  const duration = document.getElementById('s-duration').value.trim();
  const desc = document.getElementById('s-desc').value.trim();
  const category = document.getElementById('s-category').value;
  if (!name || !price) { showToast('Please fill required fields.', 'error'); return; }
  DB.services.push({ id: `s${Date.now()}`, name, price: parseFloat(price), description: desc, duration, category });
  closeModal('add-service-modal'); renderAdminServices();
  showToast(`Service "${name}" added!`, 'success');
  ['s-name', 's-price', 's-duration', 's-desc'].forEach(id => document.getElementById(id).value = '');
}

function openEditService(id) {
  const s = getServiceById(id); if (!s) return;
  document.getElementById('es-id').value = s.id; document.getElementById('es-name').value = s.name;
  document.getElementById('es-price').value = s.price; document.getElementById('es-duration').value = s.duration;
  document.getElementById('es-desc').value = s.description; document.getElementById('es-category').value = s.category;
  openModal('edit-service-modal');
}

function saveEditService() {
  const id = document.getElementById('es-id').value, s = getServiceById(id); if (!s) return;
  s.name = document.getElementById('es-name').value.trim();
  s.price = parseFloat(document.getElementById('es-price').value);
  s.duration = document.getElementById('es-duration').value.trim();
  s.description = document.getElementById('es-desc').value.trim();
  s.category = document.getElementById('es-category').value;
  closeModal('edit-service-modal'); renderAdminServices(); showToast('Service updated!', 'success');
}

function deleteService(id) {
  if (!confirm('Delete this service package?')) return;
  DB.services = DB.services.filter(s => s.id !== id); renderAdminServices(); showToast('Service deleted.', 'info');
}

// ── ADMIN CENTERS ────────────────────────────────────────────

function renderAdminCenters() {
  document.getElementById('admin-centers-grid').innerHTML = DB.centers.map(c => `
    <div class="center-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div class="center-name">🏢 ${c.name}</div>
        <span class="center-status">● ${c.status}</span>
      </div>
      ${c.rating ? `<div style="color:var(--amber);font-size:0.85rem;margin-bottom:10px">★ ${c.rating} Rating</div>` : ''}
      <div class="center-detail"><span class="center-detail-icon">📍</span><span>${c.location}</span></div>
      <div class="center-detail"><span class="center-detail-icon">📞</span><span>${c.phone}</span></div>
      <div class="center-detail"><span class="center-detail-icon">🕐</span><span>${c.hours}</span></div>
      <div class="center-detail"><span class="center-detail-icon">🚗</span><span>Capacity: ${c.capacity} vehicles/day</span></div>
      <div class="center-actions">
        <button class="btn btn-sm btn-ghost">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCenter('${c.id}')">Remove</button>
      </div>
    </div>`).join('');
}

function addCenter() {
  const name = document.getElementById('c-name').value.trim();
  const location = document.getElementById('c-location').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const hours = document.getElementById('c-hours').value.trim();
  const capacity = document.getElementById('c-capacity').value;
  if (!name || !location) { showToast('Please fill required fields.', 'error'); return; }
  DB.centers.push({ id: `c${Date.now()}`, name, location, phone, hours, capacity: parseInt(capacity) || 20, status: 'Active', rating: null });
  closeModal('add-center-modal'); renderAdminCenters(); showToast(`Center "${name}" added!`, 'success');
  ['c-name', 'c-location', 'c-phone', 'c-hours', 'c-capacity'].forEach(id => document.getElementById(id).value = '');
}

function deleteCenter(id) {
  if (!confirm('Remove this service center?')) return;
  DB.centers = DB.centers.filter(c => c.id !== id); renderAdminCenters(); showToast('Center removed.', 'info');
}

// ── ANALYTICS ────────────────────────────────────────────────

function renderAnalytics() { renderMonthlyChart(); renderServiceChart(); renderStatusChart(); renderRevenueChart(); }

function renderMonthlyChart() {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const data = [8, 12, 9, 15, 11, 14, DB.bookings.length];
  const max = Math.max(...data);
  document.getElementById('monthly-chart').innerHTML = `<div class="bar-chart">
    ${months.map((m, i) => {
    const h = Math.round((data[i] / max) * 140);
    return `<div class="bar-col">
          <div class="bar-value">${data[i]}</div>
          <div class="bar" style="height:${h}px;${i === months.length - 1 ? 'background:linear-gradient(180deg,var(--amber),var(--orange))' : ''}"></div>
          <div class="bar-label">${m}</div>
        </div>`;
  }).join('')}</div>`;
}

function renderServiceChart() {
  const counts = {};
  DB.services.forEach(s => { counts[s.name] = 0; });
  DB.bookings.forEach(b => { const s = getServiceById(b.serviceId); if (s) counts[s.name] = (counts[s.name] || 0) + 1; });
  const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#0ea5e9', '#f43f5e', '#ec4899', '#14b8a6'];
  const entries = Object.entries(counts).map(([n, c], i) => ({ name: n, count: c, color: colors[i % colors.length] }));
  const total = entries.reduce((s, e) => s + e.count, 0) || 1;
  let angle = 0;
  const stops = entries.map(e => { const pct = (e.count / total) * 100; const s = `${e.color} ${angle}% ${(angle + pct)}%`; angle += pct; return s; }).join(', ');
  document.getElementById('service-chart').innerHTML = `<div class="donut-chart">
      <div class="donut-ring" style="background:conic-gradient(${stops})">
        <div style="width:70px;height:70px;background:var(--bg-card);border-radius:50%;"></div>
        <div class="donut-center"><div class="donut-count">${total}</div><div class="donut-sub">Total</div></div>
      </div>
      <div class="donut-legend">${entries.slice(0, 6).map(e => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${e.color}"></div>
          <span class="legend-name">${e.name.length > 16 ? e.name.slice(0, 16) + '…' : e.name}</span>
          <span class="legend-num">${e.count}</span>
        </div>`).join('')}</div>
    </div>`;
}

function renderStatusChart() {
  const statuses = ['Requested', 'Approved', 'In Service', 'Completed', 'Cancelled'];
  const colors = { 'Requested': '#0ea5e9', 'Approved': '#8b5cf6', 'In Service': '#f59e0b', 'Completed': '#10b981', 'Cancelled': '#f43f5e' };
  const total = DB.bookings.length || 1;
  const counts = {}; statuses.forEach(s => { counts[s] = DB.bookings.filter(b => b.status === s).length; });
  document.getElementById('status-chart').innerHTML = `<div class="hbar-chart">
    ${statuses.map(s => {
    const pct = Math.round((counts[s] / total) * 100);
    return `<div class="hbar-row">
          <div class="hbar-label-row"><span class="hbar-name">${s}</span><span class="hbar-pct">${counts[s]} (${pct}%)</span></div>
          <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${colors[s]}"></div></div>
        </div>`;
  }).join('')}</div>`;
}

function renderRevenueChart() {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const base = [18400, 27600, 21500, 38800, 31200, 42100, 0];
  base[6] = calcRevenue(DB.bookings);
  const max = Math.max(...base) || 1;
  document.getElementById('revenue-chart').innerHTML = `<div class="bar-chart">
    ${months.map((m, i) => {
    const h = Math.round((base[i] / max) * 140);
    return `<div class="bar-col">
          <div class="bar-value" style="font-size:0.6rem">₹${(base[i] / 1000).toFixed(1)}k</div>
          <div class="bar" style="height:${h}px;background:linear-gradient(180deg,var(--emerald),var(--sky));${i === months.length - 1 ? 'opacity:1' : 'opacity:0.7'}"></div>
          <div class="bar-label">${m}</div>
        </div>`;
  }).join('')}</div>`;
}

// ── MODALS ───────────────────────────────────────────────────

function openModal(id) {
  document.getElementById('modal-overlay').classList.add('active');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

function closeModalOnOverlay(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

// ── TOAST ────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── UTILS ─────────────────────────────────────────────────────

function emptyState(icon, title, desc) {
  return `<div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <p class="empty-state-title">${title}</p>
      ${desc ? `<p class="empty-state-desc">${desc}</p>` : ''}
    </div>`;
}

// ── KEYBOARD ─────────────────────────────────────────────────
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const di = document.getElementById('booking-date'); 
  if (di) di.min = today;

  // restore login session
  if (currentUser) {
    loadApp();
  }
});

