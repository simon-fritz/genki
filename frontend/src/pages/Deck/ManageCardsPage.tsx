import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCardsByDeck, type Card } from "@/api/cards";
import { getDeck, type Deck } from "@/api/decks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import EditCardModal from "@/components/card/EditCardModal";
import api from "@/api/client";

export default function ManageCardsPage() {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    
    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchData = async () => {
        if (!deckId) {
            setError("Deck ID not found");
            setIsLoading(false);
            return;
        }

        try {
            const [deckData, cardsData] = await Promise.all([
                getDeck(deckId),
                getCardsByDeck(deckId)
            ]);
            setDeck(deckData);
            setCards(cardsData);
            setIsLoading(false);
        } catch (err) {
            console.error("Error loading cards:", err);
            setError("Failed to load cards. Please try again.");
            setIsLoading(false);
            toast.error("Failed to load cards");
        }
    };

    useEffect(() => {
        fetchData();
    }, [deckId]);

    const handleEdit = (card: Card) => {
        setEditingCard(card);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (cardId: string) => {
        if (!confirm("Are you sure you want to delete this card?")) {
            return;
        }

        try {
            await api.delete(`/cards/${cardId}/`);
            toast.success("Card deleted successfully");
            fetchData(); // Refresh the list
        } catch (err) {
            console.error("Error deleting card:", err);
            toast.error("Failed to delete card");
        }
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setEditingCard(null);
        fetchData(); // Refresh the list
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading cards...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => navigate("/")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Manage Cards: {deck?.name}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {cards.length} card{cards.length !== 1 ? 's' : ''} in this deck
                    </p>
                </div>

                {/* Cards Table */}
                {cards.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">No cards in this deck yet.</p>
                        <Button onClick={() => navigate(`/deck/${deckId}/newcard`)}>
                            Add First Card
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Front
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Back
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {cards.map((card) => (
                                    <tr key={card.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {card.front}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {card.back}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(card)}
                                                className="mr-2"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(card.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Edit Modal */}
                {editingCard && (
                    <EditCardModal
                        card={editingCard}
                        open={isEditModalOpen}
                        onOpenChange={setIsEditModalOpen}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>
        </div>
    );
}
