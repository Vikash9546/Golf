import { supabase } from '../config/supabase.js';

// @desc    Simulate and Activate Subscription (for test/dev mode)
// @route   POST /api/subscription/activate
// @access  Protected
export const activateSubscription = async (req, res) => {
    try {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ 
                subscription_status: 'ACTIVE',
                // Optional: set a renewal date 1 year from now
                updated_at: new Date()
            })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ 
            message: 'Subscription activated successfully!', 
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error activating subscription', 
            error: error.message 
        });
    }
};
