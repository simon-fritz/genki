import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCardsByDeck, reviewCard, type Card as CardType } from "@/api/cards";
import { getDeck, type Deck } from "@/api/decks";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

export default function StudyPage() {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    
    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<CardType[]>([]);
    const [totalCardsInDeck, setTotalCardsInDeck] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!deckId) {
            setError("Deck ID not found");
            setIsLoading(false);
            return;
        }

        // Load deck info and cards
        Promise.all([
            getDeck(deckId),
            getCardsByDeck(deckId)
        ])
            .then(([deckData, cardsData]) => {
                setDeck(deckData);
                setTotalCardsInDeck(cardsData.length);
                // Filter to only show cards that are due for review
                const now = new Date();
                const dueCards = cardsData.filter(card => card.dueAt <= now);
                setCards(dueCards);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error loading study session:", err);
                setError("Failed to load cards. Please try again.");
                setIsLoading(false);
                toast.error("Failed to load study session");
            });
    }, [deckId]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleReview = async (rating: number) => {
        if (!cards[currentIndex] || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const currentCard = cards[currentIndex];
            await reviewCard(currentCard.id, rating);
            
            // If rating is "Again" (0), reinsert card at position 2-4
            if (rating === 0 && currentIndex < cards.length - 1) {
                // Calculate reinsert position (2-4 cards ahead, or less if not enough cards)
                const remainingCards = cards.length - currentIndex - 1;
                const maxPosition = Math.min(4, remainingCards);
                const minPosition = Math.min(2, maxPosition);
                const reinsertPosition = currentIndex + 1 + Math.floor(Math.random() * (maxPosition - minPosition + 1)) + minPosition - 1;
                
                // Create new cards array with the card reinserted
                const newCards = [...cards];
                newCards.splice(currentIndex, 1); // Remove current card
                newCards.splice(reinsertPosition, 0, currentCard); // Reinsert at new position
                setCards(newCards);
                setIsFlipped(false);
            } else {
                // For other ratings, move to next card or finish
                if (currentIndex < cards.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setIsFlipped(false);
                } else {
                    // All cards reviewed
                    setCurrentIndex(currentIndex + 1);
                }
            }
        } catch (err) {
            console.error("Error submitting review:", err);
            toast.error("Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToDeck = () => {
        navigate("/");
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading study session...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={handleBackToDeck}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // No cards state
    if (cards.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-gray-600 mb-4">
                        No cards are due for review right now. Great job!
                    </p>
                    <Button onClick={handleBackToDeck}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // Completion state
    if (currentIndex >= cards.length) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md space-y-6">
                    <CheckCircle2 className="h-20 w-20 text-green-600 mx-auto" />
                    <h1 className="text-3xl font-bold text-gray-900">
                        Great Job!
                    </h1>
                    <p className="text-gray-600">
                        You've reviewed all {totalCardsInDeck} card{totalCardsInDeck !== 1 ? 's' : ''} in this deck.
                    </p>
                    <Button onClick={handleBackToDeck} size="lg">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="min-h-screen bg-white py-8 flex flex-col items-center">
            <div className="w-full space-y-8">
                
                {/* Header Info */}
                <div className="text-center space-y-2 relative">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {deck?.name || "Studying"}
                    </h1>
                    <p className="text-blue-600 font-medium">
                        Card {currentIndex + 1} of {cards.length}
                    </p>
                </div>

                {/* The Flashcard Area */}
                <Card 
                    className="min-h-[400px] flex flex-col shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-white overflow-auto"
                    onClick={handleFlip}
                >
                    {!isFlipped ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-10">
                            <div className="text-2xl font-serif text-gray-800 w-full text-center">
                                <MarkdownViewer content={currentCard.front} />
                            </div>
                            <p className="text-gray-400 mt-4 text-sm uppercase tracking-widest">
                                (Click to flip)
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 p-8 text-base text-gray-700 w-full text-left overflow-auto">
                            <MarkdownViewer content={currentCard.back} />
                        </div>
                    )}
                </Card>

                {/* Controls - Only show when card is flipped */}
                {isFlipped && (
                    <div className="grid grid-cols-4 gap-4">
                        <Button 
                            variant="outline" 
                            className="border-red-200 hover:bg-red-50 text-red-700"
                            onClick={() => handleReview(0)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Again"}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="border-orange-200 hover:bg-orange-50 text-orange-700"
                            onClick={() => handleReview(1)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hard"}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="border-blue-200 hover:bg-blue-50 text-blue-700"
                            onClick={() => handleReview(2)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Good"}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="border-green-200 hover:bg-green-50 text-green-700"
                            onClick={() => handleReview(3)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Easy"}
                        </Button>
                    </div>
                )}

                {/* Back button */}
                <div className="text-center">
                    <Button 
                        variant="ghost" 
                        onClick={handleBackToDeck}
                        disabled={isSubmitting}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}