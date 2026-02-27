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
