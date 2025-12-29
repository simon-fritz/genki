import { Button } from "@/components/ui/button";
import DeckDropdownMenu from "./DeckDropdownMenu";

interface DeckButtonProps {
    deckName: string;
    cardsNew: number;
    cardsLearn: number;
    cardsDue: number;
}

const DeckButton: React.FC<
    DeckButtonProps & React.ComponentProps<typeof Button>
> = ({ deckName, cardsNew, cardsLearn, cardsDue, ref, ...other }) => {
    return (
        <Button variant="outline" size={"deckbutton"} ref={ref} {...other}>
            {/* deck name on the left side of deck button */}
            <div className="flex-1 text-left font-medium text-gray-800 text-base overflow-hidden whitespace-nowrap text-ellipsis pr-4">
                {deckName}
            </div>

            {/* card counts and options menu on the right side */}
            <div className="flex items-center space-x-4 text-sm font-semibold">
                <span
                    className={`min-w-6 text-right ${cardsNew > 0 ? "text-blue-600" : "text-gray-600"}`}
                >
                    {cardsNew}
                </span>
                <span
                    className={`min-w-6 text-right ${cardsLearn > 0 ? "text-red-600" : "text-gray-600"}`}
                >
                    {cardsLearn}
                </span>
                <span
                    className={`min-w-6 text-right ${cardsNew > 0 ? "text-green-600" : "text-gray-600"}`}
                >
                    {cardsDue}
                </span>

                {/* options menu icon */}
                <DeckDropdownMenu />
                {/*<MoreVertical
                    className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0 ml-2"
                    onClick={(e) => {
                        e.stopPropagation;
                        console.log(`User clicked options for ${deckName}`);
                    }}
                />*/}
            </div>
        </Button>
    );
};

export default DeckButton;
