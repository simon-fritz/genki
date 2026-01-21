import { useState } from "react";
import { Button } from "@/components/ui/button";
import DeckActionsDialog from "./DeckActionsDialog";
import type { Deck } from "@/api/decks";

interface DeckButtonProps {
    deck: Deck;
    cardsDue: number;
    onDeckUpdated?: () => void;
}

const DeckButton = ({
    deck,
    cardsDue,
    onDeckUpdated,
    ref,
    ...other
}: DeckButtonProps & React.ComponentProps<typeof Button>) => {
    const [actionsDialogOpen, setActionsDialogOpen] = useState(false);

    const handleDeckClick = () => {
        setActionsDialogOpen(true);
    };

    return (
        <>
            <Button 
                variant="outline" 
                size={"deckbutton"} 
                ref={ref} 
                onClick={handleDeckClick}
                {...other}
            >
                {/* deck name on the left side of deck button */}
                <div className="flex-1 text-left font-medium text-gray-800 text-base overflow-hidden whitespace-nowrap text-ellipsis pr-4">
                    {deck.name}
                </div>

                {/* card counts on the right side */}
                <div className="flex items-center text-sm font-semibold">
                    <span
                        className={`min-w-6 text-right ${cardsDue > 0 ? "text-blue-600" : "text-gray-600"}`}
                    >
                        {cardsDue}
                    </span>
                </div>
            </Button>

            <DeckActionsDialog
                deck={deck}
                cardsDue={cardsDue}
                open={actionsDialogOpen}
                onOpenChange={setActionsDialogOpen}
                onDeckUpdated={onDeckUpdated}
            />
        </>
    );
};

export default DeckButton;
