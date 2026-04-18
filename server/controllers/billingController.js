import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

// Configuration constants for subscription plans
// These would map to your active plans created inside the Razorpay Dashboard
const PLANS = {
    monthly: {
        plan_id: process.env.RAZORPAY_MONTHLY_PLAN_ID || 'plan_month_default',
        total_count: 12 // Bill every month for a year before manual renewal needed
    },
    yearly: {
        plan_id: process.env.RAZORPAY_YEARLY_PLAN_ID || 'plan_year_default',
        total_count: 1 // Bill once a year
    }
};

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// @desc    Create Subscription
// @route   POST /api/billing/create-subscription
// @access  Protected
export const createSubscription = async (req, res) => {
    // The frontend sends 'monthly' or 'yearly'
    const { plan_type } = req.body; 

    if (!['monthly', 'yearly'].includes(plan_type)) {
        return res.status(400).json({ message: 'Invalid plan type selected.' });
    }

    try {
        const rzp = getRazorpayInstance();
        const planConfig = PLANS[plan_type];

        const subscription = await rzp.subscriptions.create({
            plan_id: planConfig.plan_id,
            customer_notify: 1,
            total_count: planConfig.total_count,
            notes: {
                user_id: req.user.id // Tie it directly to the authenticated user's ID
            }
        });

        res.status(200).json({ 
            subscription_id: subscription.id,
            plan_type: plan_type
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating subscription', error: error.message });
    }
};

// @desc    Cancel Subscription
// @route   POST /api/billing/cancel
// @access  Protected
export const cancelSubscription = async (req, res) => {
    const { subscription_id } = req.body;
    
    if (!subscription_id) {
        return res.status(400).json({ message: 'Subscription ID required' });
    }

    try {
        const rzp = getRazorpayInstance();
        // Cancel subscription immediately
        await rzp.subscriptions.cancel(subscription_id, false);
        
        // Update local DB to signal cancellation intent 
        // Note: The actual status swap should ideally wait for the webhook confirming 'subscription.cancelled'
        await supabase.from('users')
            .update({ subscription_status: 'CANCELLED' })
            .eq('id', req.user.id);
            
        res.status(200).json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
    }
};

// @desc    Razorpay Webhook for Subscription Lifecycle Management
// @route   POST /api/billing/webhook
// @access  Public (Razorpay hits this)
export const razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    const body = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    if (expectedSignature !== signature) {
        return res.status(400).json({ status: 'Verification failed' });
    }

    // Processing robust lifecycle events
    const event = req.body.event;
    
    try {
        if (event === 'subscription.charged' || event === 'subscription.activated') {
            const customerEmail = req.body.payload.subscription?.entity?.notes?.email || req.body.payload.payment?.entity?.email;
            let userId = req.body.payload.subscription?.entity?.notes?.user_id;

            // Determine lookup filter
            let updateFilter = userId ? { col: 'id', val: userId } : { col: 'email', val: customerEmail };

            if(updateFilter.val) {
                await supabase.from('users')
                    .update({ subscription_status: 'ACTIVE' })
                    .eq(updateFilter.col, updateFilter.val);
            }
        } 
        else if (event === 'subscription.halted' || event === 'subscription.cancelled' || event === 'subscription.completed') {
            let userId = req.body.payload.subscription?.entity?.notes?.user_id;
            let customerEmail = req.body.payload.subscription?.entity?.notes?.email;

            let updateFilter = userId ? { col: 'id', val: userId } : { col: 'email', val: customerEmail };

            if(updateFilter.val) {
                const newStatus = event === 'subscription.halted' ? 'LAPSED' : 'CANCELLED';
                await supabase.from('users')
                    .update({ subscription_status: newStatus })
                    .eq(updateFilter.col, updateFilter.val);
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (dbError) {
        // Prevent Razorpay retries if the failure was internal to our DB (or maybe we DO want retries)
        console.error("Webhook DB Sync Failed:", dbError);
        res.status(500).json({ status: 'Internal Database Sync Error' });
    }
};
