import { useState, useEffect, useCallback } from "react";

export interface BookmarkedSnippet {
  id: string;
  topic: string;
  title: string;
  image: string;
  content: string;
  example: string;
  savedAt: string;
}

const STORAGE_KEY = "swifted-bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedSnippet[]>([]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  const saveBookmarks = useCallback((newBookmarks: BookmarkedSnippet[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
    setBookmarks(newBookmarks);
  }, []);

  const addBookmark = useCallback((snippet: Omit<BookmarkedSnippet, "id" | "savedAt">) => {
    const id = `${snippet.topic}-${snippet.title}`.toLowerCase().replace(/\s+/g, "-");
    
    // Check if already bookmarked
    const exists = bookmarks.some((b) => b.id === id);
    if (exists) return;

    const newBookmark: BookmarkedSnippet = {
      ...snippet,
      id,
      savedAt: new Date().toISOString(),
    };

    saveBookmarks([newBookmark, ...bookmarks]);
  }, [bookmarks, saveBookmarks]);

  const removeBookmark = useCallback((id: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
  }, [bookmarks, saveBookmarks]);

  const isBookmarked = useCallback((topic: string, title: string) => {
    const id = `${topic}-${title}`.toLowerCase().replace(/\s+/g, "-");
    return bookmarks.some((b) => b.id === id);
  }, [bookmarks]);

  const toggleBookmark = useCallback((snippet: Omit<BookmarkedSnippet, "id" | "savedAt">) => {
    const id = `${snippet.topic}-${snippet.title}`.toLowerCase().replace(/\s+/g, "-");
    const exists = bookmarks.some((b) => b.id === id);
    
    if (exists) {
      removeBookmark(id);
    } else {
      addBookmark(snippet);
    }
  }, [bookmarks, addBookmark, removeBookmark]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
  };
}
