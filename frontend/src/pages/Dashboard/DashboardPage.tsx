import DeckButton from "@/components/dashboard/DeckButton";
import DeckEditDialog from "@/components/dashboard/DeckEditDialog";
import CreateDeckButton from "@/components/dashboard/CreateDeckButton";
import { BookOpen } from "lucide-react";
import { getDecks } from "@/api/decks";
import type { Deck } from "@/api/decks";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const DashboardPage = () => {
    const [decksFetched, setDecksFetched] = useState<Deck[]>([]);
    const [fetchError, setFetchError] = useState(false);
    const errorToastShown = useRef(false);

    const fetchDecks = () => {
        getDecks()
            .then((data) => {
                setDecksFetched(data);
                setFetchError(false);
                errorToastShown.current = false;
            })
            .catch(() => {
                setFetchError(true);
                if (!errorToastShown.current) {
                    errorToastShown.current = true;
                    toast.error("Failed to fetch decks. Please try again.");
                }
            });
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    // set new, learn, due to 0 for now because not provided by api
    const decks = decksFetched.map((deck) => ({
        ...deck,
        cardsNew: 0,
        cardsLearn: 0,
        cardsDue: 0,
    }));

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            Welcome back, Username!
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
                            <div className="flex items-center space-x-4 ml-4">
                                <span className="min-w-6 text-right">New</span>
                                <span className="min-w-6 text-right">
                                    Learn
                                </span>
                                <span className="min-w-6 text-right">Due</span>
                                <span className="w-9 ml-2"></span>
                                {/* Placeholder for the dropdown menu icon */}
                            </div>
                        </div>

                        {/* decks container */}
                        <div className="space-y-2">
                            {decks.map((deck) => (
                                <DeckButton
                                    key={deck.id}
                                    deck={deck}
                                    cardsNew={deck.cardsNew}
                                    cardsLearn={deck.cardsLearn}
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
