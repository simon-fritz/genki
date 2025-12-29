import { useNavigate } from "react-router-dom";
import {
    Plus,
    MoreVertical,
    Edit,
    Trash,
    Copy,
    TableProperties,
    Download,
    SlidersHorizontal,
    Upload,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RagUpload } from "../settings/RagUpload";

interface DeckDropdownMenuProps {
    deckId: string;
    deckName: string;
}

const DeckDropdownMenu = ({ deckId, deckName }: DeckDropdownMenuProps) => {
    const navigate = useNavigate();
    return (
        <DropdownMenu>
            {/* asChild tells DropdownMenuTrigger to use its direct child (the Button)*/}
            <DropdownMenuTrigger asChild>
                <div
                    role="button"
                    className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className="h-4 w-4" />
                    {/* screenreader text for accessibility */}
                    <span className="sr-only">More actions</span>
                </div>
            </DropdownMenuTrigger>

            {/* content of the dropdown menu */}
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem
                    onSelect={() =>
                        navigate(`/deck/${deckId}/newcard`, {
                            state: { deckId, deckName },
                        })
                    }
                >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add cards to deck</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Rename deck</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete deck</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy deck</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <TableProperties className="mr-2 h-4 w-4" />
                    <span>Manage cards</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download .apkg</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <span>Customize learning</span>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Upload className="mr-2 h-4 w-4" />
                    <RagUpload isMenuItem={true} />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DeckDropdownMenu;
