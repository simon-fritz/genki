import api from "@/api/client.ts";

// data needed to create a new Card
export interface CardToCreate {
    deck: string;
    front: string;
    back: string;
}

// how the data is returned from the backend
interface CardRaw {
    id: number;
    deck: number;
    front: string;
    back: string;
    generation_meta: Record<string, unknown>;
    due_at: string;
    interval: number;
    ease_factor: number;
    repetitions: number;
    lapses: number;
    created_at: string;
    updated_at: string;
}

// preferred representation for working in frontend
export interface Card {
    id: string;
    deck: string;
    front: string;
    back: string;
    generationMeta: Record<string, unknown>;
    dueAt: Date;
    interval: number;
    easeFactor: number;
    repetitions: number;
    lapses: number;
    createdAt: Date;
    updatedAt: Date;
}

/* Fetch all cards for the current user
 */
export async function getCards(): Promise<Card[]> {
    const response = await api.get<CardRaw[]>("/cards/");
    // make the data conform to the Card interface
    const cards = response.data.map((cardRaw) => ({
        id: cardRaw.id.toString(),
        deck: cardRaw.deck.toString(),
        front: cardRaw.front,
        back: cardRaw.back,
        generationMeta: cardRaw.generation_meta,
        dueAt: new Date(cardRaw.due_at),
        interval: cardRaw.interval,
        easeFactor: cardRaw.ease_factor,
        repetitions: cardRaw.repetitions,
        lapses: cardRaw.lapses,
        createdAt: new Date(cardRaw.created_at),
        updatedAt: new Date(cardRaw.updated_at),
    }));
    return cards;
}

/* Post one new card for the current user
 */
export async function createCard(cardData: CardToCreate): Promise<Card> {
    const response = await api.post<CardRaw>("/cards/", cardData);
    // make the data conform to the Card interface
    const cardRaw = response.data;
    const card: Card = {
        id: cardRaw.id.toString(),
        deck: cardRaw.deck.toString(),
        front: cardRaw.front,
        back: cardRaw.back,
        generationMeta: cardRaw.generation_meta,
        dueAt: new Date(cardRaw.due_at),
        interval: cardRaw.interval,
        easeFactor: cardRaw.ease_factor,
        repetitions: cardRaw.repetitions,
        lapses: cardRaw.lapses,
        createdAt: new Date(cardRaw.created_at),
        updatedAt: new Date(cardRaw.updated_at),
    };
    return card;
}
