import { Button } from "@/components/ui/button";
import DeckDropdownMenu from "./DeckDropdownMenu";
import type { Deck } from "@/api/decks";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();

    const handleDeckClick = () => {
        navigate(`/deck/${deck.id}/study`);
    };

    return (
        <Button variant="outline" size={"deckbutton"} ref={ref} {...other} onClick={handleDeckClick}>
            {/* deck name on the left side of deck button */}
            <div className="flex-1 text-left font-medium text-gray-800 text-base overflow-hidden whitespace-nowrap text-ellipsis pr-4">
                {deck.name}
            </div>

            {/* card counts and options menu on the right side */}
            <div className="flex items-center space-x-4 text-sm font-semibold">
                <span
                    className={`min-w-6 text-right ${cardsDue > 0 ? "text-blue-600" : "text-gray-600"}`}
                >
                    {cardsDue}
                </span>

                {/* options menu icon */}
                <DeckDropdownMenu deck={deck} onDeckUpdated={onDeckUpdated} />
            </div>
        </Button>
    );
};

export default DeckButton;
