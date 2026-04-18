import { supabase } from '../config/supabase.js';
import { generateWinningNumbers } from '../utils/drawAlgorithm.js';

/**
 * HELPER: Processes payouts, enforces the minimum 10% charity tax, 
 * and actively inserts funds into the philanthropy ledger.
 */
const distributePrizeAndCharity = async (winnersList, individualPayout, drawId) => {
    if (winnersList.length === 0 || individualPayout <= 0) return;

    // 1. Fetch user charity preferences in bulk for all winners in this bracket
    const winnerIds = winnersList.map(w => w.userId);
    const { data: userPrefs } = await supabase
        .from('users')
        .select('id, selected_charity_id, charity_contribution_pct')
        .in('id', winnerIds);

    // Map preferences for instant O(1) lookup
    const prefsMap = {};
    if (userPrefs) {
        userPrefs.forEach(u => prefsMap[u.id] = u);
    }

    const donationsToInsert = [];

    for (const winner of winnersList) {
        const pref = prefsMap[winner.userId] || {};
        
        // QA AUDIT FIX: Strict enforcing of PRD rule -> "Minimum 10% contribution"
        const pct = Math.max(10, pref.charity_contribution_pct || 10); 
        
        const donationAmount = individualPayout * (pct / 100);
        const netWinnings = individualPayout - donationAmount;

        // If they have a charity selected, queue the donation ledger entry
        if (pref.selected_charity_id) {
            donationsToInsert.push({
                user_id: winner.userId,
                charity_id: pref.selected_charity_id,
                draw_id: drawId,
                amount: donationAmount
            });
        }

        // Note: For 'netWinnings', we would typically update the user's wallet_balance here
        // e.g. await supabase.from('users').update({ wallet: current + netWinnings })
    }

    // 2. Perform bulk insert to exactly track total donations generated across the platform
    if (donationsToInsert.length > 0) {
        await supabase.from('donations').insert(donationsToInsert);
    }
};


// @desc    Run the Monthly Draw & Distribute Prizes
// @route   POST /api/draws/admin/run
// @access  Admin/Cron Only
export const runMonthlyDraw = async (req, res) => {
    // Mode defaults to 'algorithm' per PRD. Simulate allows dry run.
    const { mode = 'algorithm', simulate = false } = req.body; 

    try {
        // 1. Auto-calculation of base prize pool based on active subscriber count
        // PRD: "A fixed portion of each subscription contributes to the prize pool."
        const FIXED_CONTRIBUTED_PORTION = 5.00; // Configurable constant amount deducted from sub to go to jackpot

        const { count: activeSubscribers, error: subError } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('subscription_status', 'ACTIVE');
            
        if (subError) throw subError;

        const base_prize_pool = (activeSubscribers || 0) * FIXED_CONTRIBUTED_PORTION;

        // 2. Check for Jackpot Rollover from the immediate previous month
        const today = new Date();
        const prevDate = new Date(today.setMonth(today.getMonth() - 1));
        const prevMonthStr = prevDate.toISOString().slice(0, 7);

        const { data: previousDraw } = await supabase
            .from('draws')
            .select('total_prize_pool, jackpot_rolled_over')
            .eq('month_year', prevMonthStr)
            .maybeSingle();

        let rolloverFunds = 0;
        // PRD: "5-Match jackpot carries forward if unclaimed" => 40% of previous total pool
        if (previousDraw && previousDraw.jackpot_rolled_over) {
            rolloverFunds = previousDraw.total_prize_pool * 0.40; 
        }

        const TOTAL_POOL = base_prize_pool + rolloverFunds;

        // Fetch all platform scores currently lodged in system
        const { data: scores, error: scoresError } = await supabase.from('scores').select('user_id, stableford_score');
        if (scoresError) throw scoresError;

        const userTickets = {};
        scores.forEach(s => {
            if(!userTickets[s.user_id]) userTickets[s.user_id] = [];
            userTickets[s.user_id].push(s.stableford_score);
        });

        const validParticipants = [];
        for (const [userId, curScores] of Object.entries(userTickets)) {
            if (curScores.length === 5) {
                validParticipants.push({ userId, numbers: curScores });
            }
        }

        const winningNumbers = generateWinningNumbers(mode, scores);

        const pool5 = TOTAL_POOL * 0.40;
        const pool4 = TOTAL_POOL * 0.35;
        const pool3 = TOTAL_POOL * 0.25;

        let winners5 = []; let winners4 = []; let winners3 = [];

        validParticipants.forEach(p => {
             const matchCount = p.numbers.filter(num => winningNumbers.includes(num)).length;
             if (matchCount === 5) winners5.push(p);
             if (matchCount === 4) winners4.push(p);
             if (matchCount === 3) winners3.push(p);
        });

        const payout5 = winners5.length > 0 ? pool5 / winners5.length : 0;
        const payout4 = winners4.length > 0 ? pool4 / winners4.length : 0;
        const payout3 = winners3.length > 0 ? pool3 / winners3.length : 0;

        let isRollover = winners5.length === 0;
        let drawRecord = null;

        // PRD Operational Rule: Simulation vs Publish execution mapping
        if (!simulate) {
            // Create Master Draw entry persisting data
            const { data: dbEntry, error: drawError } = await supabase.from('draws').insert([{
                month_year: new Date().toISOString().slice(0, 7),
                total_prize_pool: TOTAL_POOL,
                winning_numbers: winningNumbers,
                jackpot_rolled_over: isRollover,
                status: 'COMPLETED'
            }]).select().single();

            if (drawError) throw drawError;
            drawRecord = dbEntry;

            // Execute the Charity distribution logic only on official publish mapping
            await distributePrizeAndCharity(winners5, payout5, drawRecord.id);
            await distributePrizeAndCharity(winners4, payout4, drawRecord.id);
            await distributePrizeAndCharity(winners3, payout3, drawRecord.id);
        }

        res.status(200).json({
            draw_id: simulate ? 'simulation_only' : drawRecord?.id,
            simulate_mode: simulate,
            winningNumbers,
            rollover_triggered: isRollover,
            historic_rollover_added: rolloverFunds,
            total_prize_pool: TOTAL_POOL,
            distributions: {
                match_5: { winners: winners5.length, individual_payout: payout5 },
                match_4: { winners: winners4.length, individual_payout: payout4 },
                match_3: { winners: winners3.length, individual_payout: payout3 }
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Draw execution failed', error: error.message });
    }
};
