import dotenv from 'dotenv';
// Load environment variables FIRST before any module reads process.env
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Route imports
import authRoutes from './routes/authRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import drawRoutes from './routes/drawRoutes.js';
import charityRoutes from './routes/charityRoutes.js';
import { supabase } from './config/supabase.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — CORS configured explicitly for cross-origin Vite dev server
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Platform API is active.' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/charity', charityRoutes);

// Start Server
app.listen(PORT, async () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    
    try {
        // Ping Supabase lightly to verify the anon_key is working
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            console.error('❌ Supabase Connection Error (Check your tables or keys!):', error.message);
        } else {
            console.log('✅ Supabase connected successfully!');
        }
    } catch (err) {
        console.log('❌ Supabase Ping Failed');
    }
});
