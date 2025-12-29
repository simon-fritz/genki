import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import CardFrontsideField from "@/components/create-card/CardFrontsideField";
import CardBacksideField from "@/components/create-card/CardBacksideField";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect } from "react";
import { getDeck } from "@/api/decks.ts";
import { toast } from "sonner";

const CreateCardPage = () => {
    const navigate = useNavigate();

    // get deckId from url parameter
    const { deckId } = useParams();

    // try getting deck name from location state
    const location = useLocation();
    const [deckName, setDeckName] = useState<string | null>(
        location.state?.deckName || null,
    );
    const [loading, setLoading] = useState(!location.state?.deckName);

    // fall back to using API to get deck name if not stored in location state
    // i.e. happens when user types URL directly instead of accessing page from dashboard
    useEffect(() => {
        let cancelled = false;

        if (!deckId) {
            navigate("/");
            return;
        }
        if (!deckName) {
            getDeck(deckId)
                .then((deck) => {
                    if (!cancelled) setDeckName(deck.name);
                })
                .catch(() => {
                    if (!cancelled) {
                        toast.error("The selected deck couldn't be found.");
                        navigate("/");
                    }
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }

        return () => {
            cancelled = true;
        };
    }, [deckId, deckName, navigate]);

    if (loading) {
        return <Spinner />;
    }

    return (
        <div>
            <CardFrontsideField />
            <CardBacksideField />
            <div className="flex flex-col items-end mt-4">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            navigate("/");
                        }}
                    >
                        Done
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-1" />
                        Add and continue
                    </Button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                    Card will be saved to {deckName || "..."}
                </p>
            </div>
        </div>
    );
};

export default CreateCardPage;
