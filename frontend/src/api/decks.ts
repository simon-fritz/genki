import api from "@/api/client.ts";

// how the data is returned from the backend
interface DeckRaw {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

// preferred representation for working in frontend
export interface Deck {
    id: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export async function getDecks(): Promise<Deck[]> {
    const response = await api.get<DeckRaw[]>("/decks");
    // make the data conform to the Deck interface
    const decks = response.data.map((deckRaw) => ({
        id: deckRaw.id.toString(),
        name: deckRaw.name,
        description: deckRaw.description,
        created_at: new Date(deckRaw.created_at),
        updated_at: new Date(deckRaw.updated_at),
    }));

    return decks;
}
