import { supabase } from '../config/supabase.js';

// @desc    Get user's scores
// @route   GET /api/scores
// @access  Protected
export const getScores = async (req, res) => {
    try {
        const { data: scores, error } = await supabase
            .from('scores')
            .select('*')
            .eq('user_id', req.user.id)
            .order('played_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(scores);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching scores', error: error.message });
    }
};

// @desc    Add a new score (Max 5, rolling logic, no dupes per date)
// @route   POST /api/scores
// @access  Protected
export const addScore = async (req, res) => {
    const { stableford_score, played_at } = req.body;
    const userId = req.user.id;

    if (stableford_score < 1 || stableford_score > 45) {
        return res.status(400).json({ message: 'Score must be between 1 and 45.' });
    }

    try {
        // 1. Check for duplicate score on the same date
        const { data: duplicateDate } = await supabase
            .from('scores')
            .select('id')
            .eq('user_id', userId)
            .eq('played_at', played_at)
            .maybeSingle(); // maybeSingle handles 0 or 1 rows safely

        if (duplicateDate) {
            return res.status(400).json({ message: 'A score for this date already exists.' });
        }

        // 2. Fetch current scores to check if we hit the limit of 5
        const { data: currentScores, error: countError } = await supabase
            .from('scores')
            .select('id, played_at')
            .eq('user_id', userId)
            .order('played_at', { ascending: true }); // Oldest first

        if (countError) throw countError;

        // 3. Rolling logic: If 5 or more scores exist, delete the oldest before inserting
        if (currentScores && currentScores.length >= 5) {
            const oldestScoreId = currentScores[0].id; // Ascending order means index 0 is oldest
            await supabase.from('scores').delete().eq('id', oldestScoreId);
        }

        // 4. Insert the new score
        const { data: newScore, error: insertError } = await supabase
            .from('scores')
            .insert([{ user_id: userId, stableford_score, played_at }])
            .select()
            .single();

        if (insertError) throw insertError;
        res.status(201).json(newScore);

    } catch (error) {
        res.status(500).json({ message: 'Error adding score', error: error.message });
    }
};

// @desc    Edit a score
// @route   PUT /api/scores/:id
// @access  Protected
export const editScore = async (req, res) => {
    const { id } = req.params;
    const { stableford_score, played_at } = req.body;

    if (stableford_score < 1 || stableford_score > 45) {
        return res.status(400).json({ message: 'Score must be between 1 and 45.' });
    }

    try {
        const { data: updatedScore, error } = await supabase
            .from('scores')
            .update({ stableford_score, played_at })
            .eq('id', id)
            .eq('user_id', req.user.id) // Security check: must belong to user
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!updatedScore) return res.status(404).json({ message: 'Score not found or unauthorized' });

        res.status(200).json(updatedScore);
    } catch (error) {
        res.status(500).json({ message: 'Error editing score', error: error.message });
    }
};

// @desc    Delete a score
// @route   DELETE /api/scores/:id
// @access  Protected
export const deleteScore = async (req, res) => {
    const { id } = req.params;

    try {
        const { data: deletedScore, error } = await supabase
            .from('scores')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id) // Security check
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!deletedScore) return res.status(404).json({ message: 'Score not found or unauthorized' });

        res.status(200).json({ message: 'Score deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting score', error: error.message });
    }
};
