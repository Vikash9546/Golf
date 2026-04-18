import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Check if user already exists
        const { data: existingUser, error: lookupError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (lookupError) {
            console.error('❌ Signup Lookup Error:', lookupError);
            return res.status(500).json({ message: `DB lookup failed: ${lookupError.message}` });
        }
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Insert new user into Supabase
        const { data: user, error: insertError } = await supabase
            .from('users')
            .insert([{ email, password_hash, role: 'USER', subscription_status: 'INACTIVE' }])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Signup Insert Error:', insertError);
            return res.status(500).json({ message: `DB insert failed: ${insertError.message}` });
        }

        // 4. Generate Token and Respond
        const token = generateToken(user.id, user.role);
        res.status(201).json({ 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                subscription_status: user.subscription_status 
            }, 
            token 
        });
    } catch (error) {
        console.error('❌ Signup Uncaught Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Find user by email (.maybeSingle returns null safely if no match)
        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
        
        // 2. Verify password with bcrypt
        if (user && (await bcrypt.compare(password, user.password_hash))) {
            const token = generateToken(user.id, user.role);
            res.json({ 
                user: { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role, 
                    subscription_status: user.subscription_status 
                }, 
                token 
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error or User not found' });
    }
};

// @desc    Admin: Get all users
// @route   GET /api/auth/users
// @access  Admin Only
export const getUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, role, subscription_status, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};
