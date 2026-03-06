// ============================================================
//  AutoCare Pro – API Client
// ============================================================

// Use same server that served the website
const API_BASE = "";

const API = {
    async request(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Something went wrong');
            }

            return await response.json();

        } catch (err) {
            console.error(`API Error [${method} ${endpoint}]:`, err);
            throw err;
        }
    },

    // Auth
    login: (email, password) => API.request('/auth/login', 'POST', { email, password }),
    register: (data) => API.request('/auth/register', 'POST', data),

    // Users
    updateProfile: (id, data) => API.request(`/users/${id}`, 'PATCH', data),

    // Vehicles
    getVehicles: (userId) => API.request(`/vehicles?user_id=${userId}`),
    addVehicle: (data) => API.request('/vehicles', 'POST', data),
    updateVehicle: (id, data) => API.request(`/vehicles/${id}`, 'PUT', data),
    deleteVehicle: (id) => API.request(`/vehicles/${id}`, 'DELETE'),

    // Services
    getServices: () => API.request('/services'),
    addService: (data) => API.request('/services', 'POST', data),

    // Bookings
    getBookings: (userId = null) => API.request(userId ? `/bookings?user_id=${userId}` : '/bookings'),
    addBooking: (data) => API.request('/bookings', 'POST', data),
    updateBooking: (id, updates) => API.request(`/bookings/${id}`, 'PATCH', updates),

    // Notifications
    getNotifications: (userId) => API.request(`/notifications?user_id=${userId}`),
    addNotification: (data) => API.request('/notifications', 'POST', data),
    markNotifRead: (id) => API.request(`/notifications/${id}/read`, 'PATCH'),

    // Centers
    getCenters: () => API.request('/centers'),
};