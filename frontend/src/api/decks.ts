import api from "@/api/client.ts";

// info needed to create a new deck using POST /decks
export interface DeckToCreate {
    name: string;
    description: string;
}

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

/* Fetch a list of Deck objects from the backend
 */
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

/* Create a new deck on the backend
 */
export async function createDeck(deckData: DeckToCreate): Promise<Deck> {
    const response = await api.post<DeckRaw>("/decks/", deckData);
    // make the returned data conform to the Deck interface
    const deckRaw: DeckRaw = response.data;
    const createdDeck: Deck = {
        id: deckRaw.id.toString(),
        name: deckRaw.name,
        description: deckRaw.description,
        created_at: new Date(deckRaw.created_at),
        updated_at: new Date(deckRaw.updated_at),
    };
    return createdDeck;
}
