import axios from 'axios';

// Create a configured Axios instance pointing to your Express backend
// During Step 12 (Deployment), we will swap this string to your live Vercel URL
const API = axios.create({
    baseURL: 'http://localhost:5001/api', 
});

// INTERCEPTOR: The magic of JWT security. 
// This automatically injects the auth token into the headers of EVERY request going to Node.js 
API.interceptors.request.use((req) => {
    // Standard practice: Pull the JWT saved during login
    const token = localStorage.getItem('token'); 

    if (token) {
        req.headers.Authorization = `Bearer ${token}`; // Required format for our middleware
    }
    return req;
});

// --- API METHODS TO USE IN REACT COMPONENTS ---

// 1. Auth Calls
export const login = (formData) => API.post('/auth/login', formData);
export const signup = (formData) => API.post('/auth/signup', formData);

// 2. Score Logic (These will hit the protect and verifyActiveSubscription middlewares)
export const fetchScores = () => API.get('/scores');
export const addScore = (scoreData) => API.post('/scores', scoreData);
export const deleteScore = (id) => API.delete(`/scores/${id}`);

// 3. Billing (Razorpay Interaction)
export const createSubscription = (planId) => API.post('/billing/create-subscription', { plan_id: planId });

// 4. Charity / Analytics Dashboard
export const fetchCharities = () => API.get('/charity');
export const selectCharity = (prefData) => API.put('/charity/preferences', prefData);
export const fetchUserImpact = () => API.get('/charity/impact');
