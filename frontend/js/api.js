// ============================================================
//  AutoCare Pro – API Client
// ============================================================

// Backend API URL (Render)
const API_BASE = "https://autocare-backend-e0fu.onrender.com";

const API = {
    async request(endpoint, method = "GET", body = null) {

        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {

            const response = await fetch(`${API_BASE}${endpoint}`, options);

            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }

            if (!response.ok) {
                throw new Error(data.detail || data.message || "Server error");
            }

            return data;

        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]`, error);
            throw error;
        }
    },

    // -----------------------
    // AUTH
    // -----------------------
    login: (email, password) =>
        API.request("/auth/login", "POST", { email, password }),

    register: (data) =>
        API.request("/auth/register", "POST", data),

    // -----------------------
    // USERS
    // -----------------------
    updateProfile: (id, data) =>
        API.request(`/users/${id}`, "PATCH", data),

    // -----------------------
    // VEHICLES
    // -----------------------
    getVehicles: (userId) =>
        API.request(`/vehicles?user_id=${userId}`),

    addVehicle: (data) =>
        API.request("/vehicles", "POST", data),

    updateVehicle: (id, data) =>
        API.request(`/vehicles/${id}`, "PUT", data),

    deleteVehicle: (id) =>
        API.request(`/vehicles/${id}`, "DELETE"),

    // -----------------------
    // SERVICES
    // -----------------------
    getServices: () =>
        API.request("/services"),

    addService: (data) =>
        API.request("/services", "POST", data),

    // -----------------------
    // BOOKINGS
    // -----------------------
    getBookings: (userId = null) =>
        API.request(userId ? `/bookings?user_id=${userId}` : "/bookings"),

    addBooking: (data) =>
        API.request("/bookings", "POST", data),

    updateBooking: (id, updates) =>
        API.request(`/bookings/${id}`, "PATCH", updates),

    // -----------------------
    // NOTIFICATIONS
    // -----------------------
    getNotifications: (userId) =>
        API.request(`/notifications?user_id=${userId}`),

    addNotification: (data) =>
        API.request("/notifications", "POST", data),

    markNotifRead: (id) =>
        API.request(`/notifications/${id}/read`, "PATCH"),

    // -----------------------
    // SERVICE CENTERS
    // -----------------------
    getCenters: () =>
        API.request("/centers"),
};