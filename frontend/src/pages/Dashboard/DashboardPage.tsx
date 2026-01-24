import DeckButton from "@/components/dashboard/DeckButton";
import DeckEditDialog from "@/components/dashboard/DeckEditDialog";
import CreateDeckButton from "@/components/dashboard/CreateDeckButton";
import { BookOpen } from "lucide-react";
import { getDecks } from "@/api/decks";
import type { Deck } from "@/api/decks";
import { getCardsByDeck } from "@/api/cards";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";

const DashboardPage = () => {
    const [decksFetched, setDecksFetched] = useState<Deck[]>([]);
    const [deckDueCounts, setDeckDueCounts] = useState<Record<string, number>>({});
    const [fetchError, setFetchError] = useState(false);
    const errorToastShown = useRef(false);

    const username = useMemo(() => {
        try {
            const user = localStorage.getItem("user");
            if (user) {
                return JSON.parse(user).username || "User";
            }
        } catch {
            // Ignore parse errors
        }
        return "User";
    }, []);

    const fetchDecks = async () => {
        try {
            const data = await getDecks();
            setDecksFetched(data);
            setFetchError(false);
            errorToastShown.current = false;

            // Fetch due cards count for each deck
            const counts: Record<string, number> = {};
            const now = new Date();
            await Promise.all(
                data.map(async (deck) => {
                    try {
                        const cards = await getCardsByDeck(deck.id);
                        const dueCards = cards.filter(card => card.dueAt <= now);
                        counts[deck.id] = dueCards.length;
                    } catch {
                        counts[deck.id] = 0;
                    }
                })
            );
            setDeckDueCounts(counts);
        } catch {
            setFetchError(true);
            if (!errorToastShown.current) {
                errorToastShown.current = true;
                toast.error("Failed to fetch decks. Please try again.");
            }
        }
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    // Map decks with their due counts
    const decks = decksFetched.map((deck) => ({
        ...deck,
        cardsDue: deckDueCounts[deck.id] || 0,
    }));

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            Welcome back, {username}!
                        </h1>
                    </div>
                    <p className="text-gray-600 ml-11">
                        Keep up your learning streak today
                    </p>
                </div>

                {/* Error message when fetching decks fails */}
                {fetchError && (
                    <div className="text-center text-red-500 my-3">
                        There was an error fetching your decks. Please refresh
                        the page to try again.
                    </div>
                )}

                {/* Prompt user to create decks if they don't have any */}
                {!fetchError && decks.length === 0 && (
                    <div className="text-center text-gray-500 my-3">
                        You don't have any decks yet. Create your first using
                        the button below!
                    </div>
                )}

                {/* Create Deck Button */}
                {!fetchError && (
                    <div className="mb-8">
                        <DeckEditDialog
                            mode="create"
                            trigger={<CreateDeckButton />}
                            onSuccess={fetchDecks}
                        />
                    </div>
                )}

                {/* Decks Section */}
                {decks.length > 0 && (
                    <div>
                        {/* header row with labels */}
                        <div className="hidden md:flex justify-between items-center text-sm font-medium text-gray-500 mb-2 border-b pb-1 my-2">
                            <span className="flex-1">Deck Name</span>
                            <div className="flex items-center ml-4">
                                <span className="min-w-6 text-right">Due</span>
                            </div>
                        </div>

                        {/* decks container */}
                        <div className="space-y-2">
                            {decks.map((deck) => (
                                <DeckButton
                                    key={deck.id}
                                    deck={deck}
                                    cardsDue={deck.cardsDue}
                                    onDeckUpdated={fetchDecks}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
