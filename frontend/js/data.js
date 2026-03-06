// ============================================================
//  AutoCare Pro – In-Memory Data Store  (v2)
// ============================================================

const DB = {
    users: [
        { id: 'u1', name: 'Ravi Kumar', email: 'owner@demo.com', password: 'demo123', role: 'owner', phone: '+91 98765 43210', city: 'Chennai' },
        { id: 'u2', name: 'Dhanasekar', email: 'admin@demo.com', password: 'demo123', role: 'admin', phone: '+91 91234 56789', city: 'Chennai' },
    ],

    vehicles: [
        { id: 'v1', userId: 'u1', type: 'Car', model: 'Toyota Camry', regNumber: 'TN 01 AB 1234', year: 2021, color: 'Pearl White' },
        { id: 'v2', userId: 'u1', type: 'Bike', model: 'Royal Enfield Bullet 350', regNumber: 'TN 02 CD 5678', year: 2022, color: 'Redditch Red' },
        { id: 'v3', userId: 'u1', type: 'SUV', model: 'Mahindra Thar', regNumber: 'TN 03 EF 9012', year: 2023, color: 'Galaxy Grey' },
    ],

    services: [
        { id: 's1', name: 'Oil Change', price: 599, description: 'Engine oil replacement with filter change. Keeps your engine running smoothly.', duration: '45 min', category: 'Basic' },
        { id: 's2', name: 'General Service', price: 1999, description: 'Full vehicle inspection, fluid top-up, brake check, and air filter service.', duration: '3-4 hours', category: 'Standard' },
        { id: 's3', name: 'Brake Check & Repair', price: 1299, description: 'Complete brake system inspection, pad replacement & rotor resurfacing if needed.', duration: '1-2 hours', category: 'Standard' },
        { id: 's4', name: 'Premium Full Service', price: 3999, description: 'Complete vehicle overhaul – engine tuning, AC service, body polish & deep cleaning.', duration: '6-8 hours', category: 'Premium' },
        { id: 's5', name: 'Tyre Rotation & Balance', price: 699, description: 'Rotate all four tyres and perform wheel balancing for even wear and smooth drive.', duration: '1 hour', category: 'Basic' },
        { id: 's6', name: 'AC Service & Gas Refill', price: 1799, description: 'AC compressor check, cooling coil cleaning and refrigerant gas refill.', duration: '2-3 hours', category: 'Standard' },
        { id: 's7', name: 'Engine Diagnostics', price: 899, description: 'Full OBD scan and diagnostic report. Identify hidden faults before they worsen.', duration: '1 hour', category: 'Basic' },
        { id: 's8', name: 'Full Body Detailing', price: 2499, description: 'Exterior wash, clay bar treatment, paint sealant, interior vacuum & leather care.', duration: '4-5 hours', category: 'Premium' },
    ],

    bookings: [
        {
            id: 'b1', userId: 'u1', vehicleId: 'v1', serviceId: 's2',
            date: '2026-01-15', slot: '10:00 AM',
            status: 'Completed', createdAt: '2026-01-12T10:30:00',
            invoiceId: 'INV-2026-0001', rating: 5, review: 'Excellent service! Very professional staff and my car feels brand new.'
        },
        {
            id: 'b2', userId: 'u1', vehicleId: 'v2', serviceId: 's1',
            date: '2026-02-05', slot: '2:00 PM',
            status: 'Completed', createdAt: '2026-02-02T14:00:00',
            invoiceId: 'INV-2026-0002', rating: 4, review: 'Good and quick service. Oil change done efficiently.'
        },
        {
            id: 'b3', userId: 'u1', vehicleId: 'v3', serviceId: 's4',
            date: '2026-02-20', slot: '9:00 AM',
            status: 'Completed', createdAt: '2026-02-18T09:00:00',
            invoiceId: 'INV-2026-0003', rating: 5, review: 'Premium full service was absolutely worth it!'
        },
        {
            id: 'b4', userId: 'u1', vehicleId: 'v1', serviceId: 's5',
            date: '2026-02-25', slot: '11:00 AM',
            status: 'Approved', createdAt: '2026-02-22T08:00:00',
            invoiceId: null, rating: null, review: null
        },
        {
            id: 'b5', userId: 'u1', vehicleId: 'v2', serviceId: 's6',
            date: '2026-02-26', slot: '3:00 PM',
            status: 'In Service', createdAt: '2026-02-24T08:00:00',
            invoiceId: null, rating: null, review: null
        },
        {
            id: 'b6', userId: 'u1', vehicleId: 'v1', serviceId: 's7',
            date: '2026-03-05', slot: '11:00 AM',
            status: 'Requested', createdAt: '2026-02-26T08:00:00',
            invoiceId: null, rating: null, review: null
        },
    ],

    notifications: [
        { id: 'n1', userId: 'u1', icon: '✅', title: 'Service Completed', message: 'Your Premium Full Service for TN 03 EF 9012 is complete. Check your invoice.', time: '2026-02-20T18:00:00', read: false },
        { id: 'n2', userId: 'u1', icon: '🔧', title: 'In Service', message: 'Your Royal Enfield Bullet 350 has entered the service bay. Stay tuned!', time: '2026-02-26T15:05:00', read: false },
        { id: 'n3', userId: 'u1', icon: '📅', title: 'Booking Approved', message: 'Tyre Rotation & Balance for Toyota Camry approved for Feb 25 at 11:00 AM.', time: '2026-02-22T15:00:00', read: true },
        { id: 'n4', userId: 'u1', icon: '🔔', title: 'Booking Confirmed!', message: 'Engine Diagnostics for Camry scheduled on Mar 5 at 11:00 AM.', time: '2026-02-26T08:05:00', read: false },
        { id: 'n5', userId: 'u1', icon: '⭐', title: 'Service Reminder', message: 'Your Toyota Camry is due for its next General Service. Book now!', time: '2026-02-24T10:00:00', read: true },
    ],

    centers: [
        { id: 'c1', name: 'AutoCare Downtown', location: '12 Anna Salai, Chennai – 600002', phone: '+91 98765 43210', hours: '9 AM – 7 PM', capacity: 25, status: 'Active', rating: 4.8 },
        { id: 'c2', name: 'AutoCare West Hub', location: '45 Mount Road, Guindy, Chennai – 600032', phone: '+91 98765 43211', hours: '8 AM – 6 PM', capacity: 20, status: 'Active', rating: 4.6 },
        { id: 'c3', name: 'AutoCare North Star', location: '7 GST Road, Ambattur, Chennai – 600058', phone: '+91 98765 43212', hours: '9 AM – 8 PM', capacity: 30, status: 'Active', rating: 4.9 },
    ],

    reviews: [],   // will receive new review objects { id, bookingId, userId, rating, text, date }

    nextId: { user: 100, vehicle: 100, booking: 100, notification: 100, service: 100, center: 100, review: 100 },
};

// ============================================================
//  ID generator
// ============================================================
function generateId(prefix) {
    DB.nextId[prefix] = (DB.nextId[prefix] || 100) + 1;
    return `${prefix}${DB.nextId[prefix]}`;
}

// ============================================================
//  Retrieval helpers - Updated to use store
// ============================================================
function getUserById(id) { return store.users.find(u => u.id === id) || store.users.find(u => String(u.id) === String(id)); }
function getVehicleById(id) { return store.vehicles.find(v => v.id === id) || store.vehicles.find(v => String(v.id) === String(id)); }
function getServiceById(id) { return store.services.find(s => s.id === id) || store.services.find(s => String(s.id) === String(id)); }
function getBookingById(id) { return store.bookings.find(b => b.id === id) || store.bookings.find(b => String(b.id) === String(id)); }
function getVehiclesByUser(uid) { return store.vehicles.filter(v => v.user_id === uid || String(v.user_id) === String(uid)); }
function getBookingsByUser(uid) { return store.bookings.filter(b => b.user_id === uid || String(b.user_id) === String(uid)); }
function getUserNotifications(uid) { return store.notifications.filter(n => n.user_id === uid || String(n.user_id) === String(uid)); }

// ============================================================
//  Formatting helpers
// ============================================================
function vehicleIcon(type) {
    return { Car: '🚗', Bike: '🏍', Truck: '🚛', SUV: '🚙', Van: '🚐' }[type] || '🚗';
}

function statusClass(s) {
    return {
        'Requested': 'status-requested',
        'Approved': 'status-approved',
        'In Service': 'status-in-service',
        'Completed': 'status-completed',
        'Cancelled': 'status-cancelled',
    }[s] || '';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dtStr) {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

function relativeTime(dtStr) {
    const diff = Date.now() - new Date(dtStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dtStr.split('T')[0]);
}

function categoryBadge(cat) {
    const map = {
        'Basic': '<span class="service-badge badge-basic">Basic</span>',
        'Standard': '<span class="service-badge badge-standard">Standard</span>',
        'Premium': '<span class="service-badge badge-premium">Premium</span>',
    };
    return map[cat] || '';
}

function starRating(n) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
}

// ============================================================
//  Revenue stats helper
// ============================================================
function calcRevenue(bookings) {
    return bookings
        .filter(b => b.status === 'Completed')
        .reduce((sum, b) => {
            const s = getServiceById(b.service_id);
            const price = s?.price || 0;
            return sum + price + Math.round(price * 0.18);   // with GST
        }, 0);
}
