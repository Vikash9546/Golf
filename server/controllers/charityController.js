import { supabase } from '../config/supabase.js';

// @desc    Get master list of charities available on the platform
// @route   GET /api/charity
// @access  Protected
export const getCharities = async (req, res) => {
    try {
        // In a real app, Admin creates these in the `charities` table
        const { data: charities, error } = await supabase.from('charities').select('*');
        if (error) throw error;
        
        res.status(200).json(charities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching charities', error: error.message });
    }
};

// @desc    Update user charity preferences (Selection & %)
// @route   PUT /api/charity/preferences
// @access  Protected
export const selectCharityPreferences = async (req, res) => {
    const { charity_id, contribution_pct } = req.body;

    // PRD REQUIREMENT: Enforce absolute minimum of 10%
    if (contribution_pct === undefined || contribution_pct < 10) {
        return res.status(400).json({ message: 'Contribution percentage must be at least 10%.' });
    }

    try {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ 
                selected_charity_id: charity_id, 
                charity_contribution_pct: contribution_pct 
            })
            .eq('id', req.user.id)
            .select('selected_charity_id, charity_contribution_pct')
            .single();

        if (error) throw error;

        res.status(200).json({ 
            message: 'Charity preferences updated successfully', 
            data: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating preferences', error: error.message });
    }
};

// @desc    Get user's total donation impact and history
// @route   GET /api/charity/impact
// @access  Protected
export const getUserImpact = async (req, res) => {
    try {
        // We aggregate the 'amount' column in the donations table for this user.
        // The foreign key relational querying lets us grab the charity name instantly!
        const { data: donations, error } = await supabase
            .from('donations')
            .select('amount, created_at, charities(name)')
            .eq('user_id', req.user.id);

        if (error) throw error;

        // Calculate total amount donated over the life of the account
        const total_donated = donations.reduce((acc, curr) => acc + Number(curr.amount), 0);

        res.status(200).json({
            total_donated,
            donation_history: donations
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching impact analytics', error: error.message });
    }
};

// @desc    Admin: Create a new charity
// @route   POST /api/charity/admin
// @access  Admin Only
export const createCharity = async (req, res) => {
    const { name, description, image_url, upcoming_events } = req.body;
    try {
        const { data, error } = await supabase
            .from('charities')
            .insert([{ name, description, image_url, upcoming_events }])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error creating charity', error: error.message });
    }
};

// @desc    Admin: Update an existing charity
// @route   PUT /api/charity/admin/:id
// @access  Admin Only
export const updateCharity = async (req, res) => {
    const { id } = req.params;
    const { name, description, image_url, upcoming_events } = req.body;
    try {
        const { data, error } = await supabase
            .from('charities')
            .update({ name, description, image_url, upcoming_events })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error updating charity', error: error.message });
    }
};

// @desc    Admin: Delete a charity
// @route   DELETE /api/charity/admin/:id
// @access  Admin Only
export const deleteCharity = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('charities')
            .delete()
            .eq('id', id);
        if (error) throw error;
        res.status(200).json({ message: 'Charity deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting charity', error: error.message });
    }
};
