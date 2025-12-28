import DeckButton from "@/components/dashboard/DeckButton";
import CreateDeckButton from "@/components/dashboard/CreateDeckButton";
import { BookOpen } from "lucide-react";

const placeholderDecks = [
    {
        id: "0000001",
        deckName: "DEUTSCH",
        cardsNew: 12,
        cardsLearn: 14,
        cardsDue: 5,
    },
    {
        id: "0000002",
        deckName: "Intro to Deep Learning",
        cardsNew: 12,
        cardsLearn: 14,
        cardsDue: 5,
    },
    {
        id: "0000003",
        deckName: "Foundations of Generative AI",
        cardsNew: 12,
        cardsLearn: 14,
        cardsDue: 5,
    },
];

const DashboardPage = () => {
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

                {/* Create Deck Button */}
                <div className="mb-8">
                    <CreateDeckButton />
                </div>

                {/* Decks Section */}
                <div>
                    {/* header row with labels */}
                    <div className="hidden md:flex justify-between items-center text-sm font-semibold text-gray-600 mb-3 px-4 uppercase tracking-wider">
                        <span className="flex-1">Deck Name</span>
                        <div className="flex items-center space-x-2 text-sm font-semibold">
                            <span className="min-w-6 text-right text-blue-600">
                                New
                            </span>
                            <span className="min-w-6 text-right text-red-600">
                                Learn
                            </span>
                            <span className="min-w-6 text-right text-green-600">
                                Due
                            </span>
                            <span className="w-9"></span>
                        </div>
                    </div>

                    {/* decks container */}
                    <div className="space-y-2">
                        {placeholderDecks.map((deck) => (
                            <DeckButton
                                key={deck.id}
                                deckId={deck.id}
                                deckName={deck.deckName}
                                cardsNew={deck.cardsNew}
                                cardsLearn={deck.cardsLearn}
                                cardsDue={deck.cardsDue}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
