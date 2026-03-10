import { supabase } from '@/lib/supabase';

// Snippet Types
export interface Snippet {
    id: string;
    topic: string;
    title: string;
    content: string;
    example: string;
    image_url: string;
    quiz: Array<{
        id?: string;
        text: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }>;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string;
}

// User Progress Types
export interface UserProgress {
    id: string;
    user_id: string;
    snippet_id: string;
    completed: boolean;
    completed_at: string | null;
}

// Bookmark Types
export interface Bookmark {
    id: string;
    user_id: string;
    snippet_id: string;
    snippet?: Snippet;
    created_at: string;
}

// Roadmap Types
export interface Roadmap {
    id: string;
    category: string;
    title: string;
    description: string;
    cover_image: string;
    icon: string;
    units: Array<{
        id?: string;
        title: string;
        order: number;
        body: string;
        quiz?: any[];
    }>;
    snippet_count: number;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string;
}

/**
 * Fetch all snippets from the database
 */
export async function getSnippets(): Promise<Snippet[]> {
    const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching snippets:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch a single snippet by ID
 */
export async function getSnippetById(id: string): Promise<Snippet | null> {
    const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching snippet:', error);
        return null;
    }

    return data;
}

/**
 * Get user's progress for all snippets
 */
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user progress:', error);
        throw error;
    }

    return data || [];
}

/**
 * Mark a snippet as complete for a user
 */
export async function updateProgress(
    userId: string,
    snippetId: string,
    completed: boolean
): Promise<void> {
    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: userId,
            snippet_id: snippetId,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
        });

    if (error) {
        console.error('Error updating progress:', error);
        throw error;
    }
}

/**
 * Get user's bookmarked snippets
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
      *,
      snippet:snippets(*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bookmarks:', error);
        throw error;
    }

    return data || [];
}

/**
 * Toggle bookmark for a snippet
 */
export async function toggleBookmark(
    userId: string,
    snippetId: string
): Promise<boolean> {
    // Check if bookmark exists
    const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('snippet_id', snippetId)
        .single();

    if (existing) {
        // Remove bookmark
        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', existing.id);

        if (error) {
            console.error('Error removing bookmark:', error);
            throw error;
        }
        return false; // Bookmark removed
    } else {
        // Add bookmark
        const { error } = await supabase
            .from('bookmarks')
            .insert({
                user_id: userId,
                snippet_id: snippetId,
            });

        if (error) {
            console.error('Error adding bookmark:', error);
            throw error;
        }
        return true; // Bookmark added
    }
}

/**
 * Fetch daily content (quiz, vocab, longread) for a given date
 */
export interface DailyContent {
    date: string;
    quiz?: {
        questions: Array<{
            id?: string;
            text: string;
            options: string[];
            correctIndex: number;
            explanation: string;
        }>;
    };
    vocab?: Array<{
        id: string;
        word: string;
        meaning: string;
        example: string;
    }>;
    longRead?: {
        title: string;
        imageUrl?: string;
        body: string;
        quiz?: { questions: any[] };
    };
}

export async function getDailyContent(date: string): Promise<DailyContent> {
    const { data } = await supabase
        .from('daily_content')
        .select('type, data')
        .eq('date', date);

    const result: DailyContent = { date };
    for (const row of (data || [])) {
        if (row.type === 'quiz') result.quiz = row.data;
        if (row.type === 'vocab') result.vocab = row.data;
        if (row.type === 'longread') result.longRead = row.data;
    }
    return result;
}

/**
 * Get all roadmaps
 */
export async function getRoadmaps(): Promise<Roadmap[]> {
    const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching roadmaps:', error);
        throw error;
    }

    return data || [];
}

// =========================================================================
// USER TRACKING (Stats & Streaks)
// =========================================================================

export interface UserStats {
    user_id: string;
    snippets_completed: number;
    total_points: number;
}

export interface UserStreaks {
    user_id: string;
    current_streak: number;
    longest_streak: number;
    quizzes_today: number;
    streak_history: Record<string, number>;
    milestones: { firstStreak: boolean; firstRoadmapUnit: boolean; };
    last_active_roadmap: {
        categoryId: string;
        roadmapIndex: number;
        unitIndex: number;
        unitTitle: string;
    } | null;
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        console.error('Error fetching user stats:', error);
    }
    return data;
}

export async function updateUserStats(stats: UserStats): Promise<void> {
    const { error } = await supabase
        .from('user_stats')
        .upsert({ ...stats, updated_at: new Date().toISOString() });

    if (error) {
        if (error.code === 'PGRST205') return; // Table doesn't exist yet — silently skip
        console.error('Error updating user stats:', error);
        throw error;
    }
}

export async function getUserStreaks(userId: string): Promise<UserStreaks | null> {
    const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        console.error('Error fetching user streaks:', error);
    }

    // Map column names to our local formats
    if (data) {
        return {
            user_id: data.user_id,
            current_streak: data.current_streak,
            longest_streak: data.longest_streak,
            quizzes_today: data.quizzes_today,
            streak_history: data.streak_history,
            milestones: data.milestones,
            last_active_roadmap: data.last_active_roadmap
        };
    }
    return null;
}

export async function updateUserStreaks(streaks: UserStreaks): Promise<void> {
    const { error } = await supabase
        .from('user_streaks')
        .upsert({
            user_id: streaks.user_id,
            current_streak: streaks.current_streak,
            longest_streak: streaks.longest_streak,
            quizzes_today: streaks.quizzes_today,
            streak_history: streaks.streak_history,
            milestones: streaks.milestones,
            last_active_roadmap: streaks.last_active_roadmap,
            updated_at: new Date().toISOString()
        });

    if (error) {
        if (error.code === 'PGRST205') return; // Table doesn't exist yet — silently skip
        console.error('Error updating user streaks:', error);
        throw error;
    }
}

// =========================================================================
// ROADMAP PROGRESS
// =========================================================================

/**
 * Get the completed lesson indices for a user's roadmap
 */
export async function getRoadmapProgress(userId: string, roadmapId: string): Promise<number[]> {
    const { data, error } = await supabase
        .from('roadmap_progress')
        .select('completed_units')
        .eq('user_id', userId)
        .eq('roadmap_id', roadmapId)
        .maybeSingle();

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        console.error('Error fetching roadmap progress:', error);
    }
    return data?.completed_units ?? [];
}

/**
 * Save the completed lesson indices for a user's roadmap
 */
export async function saveRoadmapProgress(userId: string, roadmapId: string, completedUnits: number[]): Promise<void> {
    const { error } = await supabase
        .from('roadmap_progress')
        .upsert({
            user_id: userId,
            roadmap_id: roadmapId,
            completed_units: completedUnits,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        if (error.code === 'PGRST205') return;
        console.error('Error saving roadmap progress:', error);
        throw error;
    }
}
