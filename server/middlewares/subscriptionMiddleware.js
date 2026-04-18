import { supabase } from '../config/supabase.js';

export const verifyActiveSubscription = async (req, res, next) => {
    // 1. Verify user exists from previous `protect` auth middleware
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        // 2. Fetch fresh user status from DB to ensure they haven't cancelled recently
        const { data: user, error } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', req.user.id)
            .single();
            
        if (error || !user) {
            return res.status(404).json({ message: 'User not found in database' });
        }

        // 3. Check if status is ACTIVE
        if (user.subscription_status === 'ACTIVE') {
            next(); // Move to the target controller (e.g., submit score)
        } else {
            res.status(403).json({ message: 'Access denied: Active subscription required.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error validating subscription' });
    }
};
