import DeckButton from "@/components/dashboard/DeckButton";
import CreateDeckButton from "@/components/dashboard/CreateDeckButton";

const placeholderDecks = [
    {
        id: 1,
        deckName: "French",
        cardsNew: 12,
        cardsLearn: 14,
        cardsDue: 5,
    },
    {
        id: 2,
        deckName: "Intro to Deep Learning",
        cardsNew: 12,
        cardsLearn: 14,
        cardsDue: 5,
    },
    {
        id: 3,
        deckName: "Foundations of Generative AI",
        cardsNew: 12,
        cardsLearn: 14,
        cardsDue: 5,
    },
];

const DashboardPage = () => {
    return (
        <div>
            <h1 className={"text-center text-2xl font-semibold text-blue-500"}>
                Welcome to Genki, Username!
            </h1>

            <div className="h-8"></div>

            <CreateDeckButton />

            {/* header row with labels */}
            <div className="hidden md:flex justify-between items-center text-sm font-medium text-gray-500 mb-2 border-b pb-1 my-2">
                <span className="flex-1">Deck Name</span>
                <div className="flex items-center space-x-4 ml-4">
                    <span className="min-w-6 text-right">New</span>
                    <span className="min-w-6 text-right">Learn</span>
                    <span className="min-w-6 text-right">Due</span>
                    <span className="w-9 ml-2"></span>
                    {/* Placeholder for the dropdown menu icon */}
                </div>
            </div>

            {/* decks */}
            {placeholderDecks.map((deck) => (
                <DeckButton
                    key={deck.id}
                    deckName={deck.deckName}
                    cardsNew={deck.cardsNew}
                    cardsLearn={deck.cardsLearn}
                    cardsDue={deck.cardsDue}
                />
            ))}
        </div>
    );
};

export default DashboardPage;
