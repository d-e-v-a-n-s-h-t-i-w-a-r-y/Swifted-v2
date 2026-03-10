import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStats, updateUserStats, UserStats } from "@/services/supabaseService";

const STATS_KEY = "swifted-stats";

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
            // Load local data first
            let localData = { ...defaultStats };
            const saved = localStorage.getItem(STATS_KEY);
            if (saved) {
                try {
                    localData = { ...defaultStats, ...JSON.parse(saved) };
                } catch (e) {
                    console.error("Failed to parse stats", e);
                }
            }

            if (user) {
                try {
                    const remoteData = await getUserStats(user.id);
                    if (remoteData) {
                        setStats({
                            snippetsCompleted: remoteData.snippets_completed,
                            totalPoints: remoteData.total_points,
                        });
                        setIsLoaded(true);
                        return;
                    } else {
                        // No remote data yet, sync local data up
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

        localStorage.setItem(STATS_KEY, JSON.stringify(stats));

        if (user && (needsRemoteSync.current || isLoaded)) {
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
