// Utility to track which decks have uploaded documents
// Since we can't query the backend for this, we store it in localStorage

const STORAGE_KEY = "decks_with_documents";

export function getDecksWithDocuments(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function markDeckHasDocuments(deckId: string): void {
    const decks = getDecksWithDocuments();
    if (!decks.includes(deckId)) {
        decks.push(deckId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    }
}

export function deckHasDocuments(deckId: string): boolean {
    return getDecksWithDocuments().includes(deckId);
}

export function removeDeckDocuments(deckId: string): void {
    const decks = getDecksWithDocuments().filter((id) => id !== deckId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}
