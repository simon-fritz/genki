import { useState } from "react";
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
import { RagUpload } from "@/components/dashboard/RagUpload";
import DeckEditDialog from "@/components/dashboard/DeckEditDialog";
import type { Deck } from "@/api/decks";
import DeckDeleteDialog from "@/components/dashboard/DeckDeleteDialog";
import { getCardsByDeck } from "@/api/cards";
import { exportToApkg, downloadApkg } from "@/lib/ankiExport";
import { toast } from "sonner";

interface DeckDropdownMenuProps {
    deck: Deck;
    onDeckUpdated?: () => void;
}

const DeckDropdownMenu = ({ deck, onDeckUpdated }: DeckDropdownMenuProps) => {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const navigate = useNavigate();

    const handleExport = async () => {
        try {
            toast.info("Preparing deck export...");
            const cards = await getCardsByDeck(deck.id);
            const blob = await exportToApkg({ name: deck.name, cards });
            downloadApkg(blob, deck.name);
            toast.success("Deck exported successfully!");
        } catch (err) {
            console.error("Error exporting deck:", err);
            toast.error("Failed to export deck");
        }
    };

    return (
        <>
            <DeckEditDialog
                mode="edit"
                deck={deck}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={onDeckUpdated}
            />
            <DeckDeleteDialog
                deck={deck}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onSuccess={onDeckUpdated}
            />
            <RagUpload
                deckId={deck.id}
                deckName={deck.name}
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
            />
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
                <DropdownMenuContent align="end" className="w-60" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                        onSelect={() =>
                            navigate(`/deck/${deck.id}/newcard`, {
                                state: { deckId: deck.id, deckName: deck.name },
                            })
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Add cards to deck</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit deck details</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onSelect={() => setDeleteDialogOpen(true)}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete deck</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copy deck</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onSelect={() => navigate(`/deck/${deck.id}/manage`)}
                    >
                        <TableProperties className="mr-2 h-4 w-4" />
                        <span>Manage cards</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onSelect={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download .apkg</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onSelect={() => navigate("/settings")}>
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        <span>Customize learning</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onSelect={() => setUploadDialogOpen(true)}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        <span>Upload PDF</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export default DeckDropdownMenu;
