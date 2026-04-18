// Generate 5 winning numbers (Max Stableford standard is typically up to 45)
export const generateWinningNumbers = (mode, allScoresArray) => {
    const MAX_NUMBER = 45;
    const NUM_REQUIRED = 5;
    const pool = new Set();
    
    if (mode === 'random') {
        // Fully Random Logic (Cryptography standard Math.random for MVP)
        while(pool.size < NUM_REQUIRED) {
            pool.add(Math.floor(Math.random() * MAX_NUMBER) + 1);
        }
    } else if (mode === 'algorithm') {
        // Based on Score Frequency Logic across the platform
        const frequencies = {};
        allScoresArray.forEach(scoreRecord => {
            let s = scoreRecord.stableford_score;
            if (s > 0 && s <= MAX_NUMBER) {
                frequencies[s] = (frequencies[s] || 0) + 1;
            }
        });
        
        // Sort scores by how often they were played platform-wide
        const sortedScores = Object.keys(frequencies).sort((a,b) => frequencies[b] - frequencies[a]);
        
        // Pick the top 5 most frequently played Stableford scores as the winning numbers
        for (let i = 0; i < sortedScores.length && pool.size < NUM_REQUIRED; i++) {
            pool.add(Number(sortedScores[i]));
        }
        
        // Fallback: Pad with random numbers if the platform didn't have 5 unique scores this month
        while(pool.size < NUM_REQUIRED) {
            pool.add(Math.floor(Math.random() * MAX_NUMBER) + 1);
        }
    }
    
    // Return array sorted numerically
    return Array.from(pool).sort((a,b) => a - b);
}
