import { api } from './client';

// Since gamification data is returned with task updates, we might not have a dedicated GET endpoint yet.
// However, looking at controllers/gamification (if it existed) or just user profile.
// Actually, in the tasks controller, we saw `Gamification` model usage but no dedicated `gamification` routes were visible in the "code interaction" so far?
// Wait, I didn't see a `server/routes/gamification.js`.
// But `server/models/Gamification.js` exists.
// I should create a route to fetch current user's gamification stats.

// TEMPORARY: I will look for where to add this. Ideally `server/routes/gamification.js`.
// For now, I'll export fetchGamification which calls a new endpoint I'll creating.

export const fetchGamificationStats = async () => {
    // We need to create this endpoint on server if it doesn't exist
    const res = await api.get('/gamification/stats'); 
    return res.data;
};

// Also fetch activity history
export const fetchActivityHistory = async () => {
    // This might need aggregation on server.
    // Or we can fetch tasks + reflections and aggregate on client for now (ActivityHeatmap handles client-side aggregation passed to it).
    // So we just need tasks/reflections which we have.
    return [];
};
