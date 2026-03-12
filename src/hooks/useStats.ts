import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStats, updateUserStats, UserStats } from "@/services/supabaseService";

// Remove the static STATS_KEY constraint so we can use dynamic keys per user
export interface StatsData {
    snippetsCompleted: number;
    totalPoints: number;
}

const defaultStats: StatsData = {
    snippetsCompleted: 0,
    totalPoints: 0,
};

export function useStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<StatsData>(defaultStats);
    const [isLoaded, setIsLoaded] = useState(false);
    const needsRemoteSync = useRef(false);

    useEffect(() => {
        async function loadData() {
            const userKey = `swifted-stats-${user?.id || 'guest'}`;
            const guestKey = `swifted-stats-guest`;
            const legacyKey = `swifted-stats`;
            
            let localData = { ...defaultStats };

            // 1. Try to load local data
            try {
                const saved = localStorage.getItem(userKey);
                if (saved) {
                    localData = { ...defaultStats, ...JSON.parse(saved) };
                } else if (user) {
                    // Newly logged in: migrate guest or legacy progress
                    const guestSaved = localStorage.getItem(guestKey) || localStorage.getItem(legacyKey);
                    if (guestSaved) {
                        localData = { ...defaultStats, ...JSON.parse(guestSaved) };
                        localStorage.setItem(userKey, guestSaved);
                        // Optional: Clear legacy/guest to prevent reuse by another account?
                        // We'll leave them for now in case they logout, but if we want strict security we'd clear them.
                        localStorage.removeItem(guestKey);
                        localStorage.removeItem(legacyKey);
                    }
                } else {
                    // Guest: check legacy
                    const legacySaved = localStorage.getItem(legacyKey);
                    if (legacySaved) {
                        localData = { ...defaultStats, ...JSON.parse(legacySaved) };
                        localStorage.setItem(userKey, legacySaved);
                    }
                }
            } catch (e) {
                console.error("Failed to parse local stats", e);
            }

            // 2. Load remote if authenticated
            if (user) {
                try {
                    const remoteData = await getUserStats(user.id);
                    if (remoteData) {
                        // Merge logic: Take the max of local vs remote points/snippets to ensure no data loss
                        const mergedSnippets = Math.max(localData.snippetsCompleted, remoteData.snippets_completed);
                        const mergedPoints = Math.max(localData.totalPoints, remoteData.total_points);
                        
                        setStats({
                            snippetsCompleted: mergedSnippets,
                            totalPoints: mergedPoints,
                        });
                        
                        // If local was higher (e.g. they did work offline or we migrated guest data), sync UP
                        if (mergedSnippets > remoteData.snippets_completed || mergedPoints > remoteData.total_points) {
                             needsRemoteSync.current = true;
                        }
                        
                        setIsLoaded(true);
                        return;
                    } else {
                        // No remote data yet (new user), sync local data up
                        needsRemoteSync.current = true;
                    }
                } catch (e) {
                    console.error("Failed to load remote stats", e);
                }
            }

            setStats(localData);
            setIsLoaded(true);
        }

        loadData();
    }, [user]);

    useEffect(() => {
        if (!isLoaded) return;

        const userKey = `swifted-stats-${user?.id || 'guest'}`;
        localStorage.setItem(userKey, JSON.stringify(stats));

        if (user?.id && needsRemoteSync.current) {
            needsRemoteSync.current = false;
            const remotePayload: UserStats = {
                user_id: user.id,
                snippets_completed: stats.snippetsCompleted,
                total_points: stats.totalPoints,
            };

            updateUserStats(remotePayload).catch(e => {
                console.error("Failed to sync stats to Supabase", e);
            });
        }
    }, [stats, isLoaded, user]);

    const addStats = useCallback((snippetsToAdd: number, pointsToAdd: number) => {
        needsRemoteSync.current = true;
        setStats(prev => ({
            snippetsCompleted: prev.snippetsCompleted + snippetsToAdd,
            totalPoints: prev.totalPoints + pointsToAdd,
        }));
    }, []);

    return {
        ...stats,
        addStats,
    };
}
