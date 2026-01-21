import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, TableProperties, Trash, Edit, Download, Upload } from "lucide-react";
import type { Deck } from "@/api/decks";
import DeckDeleteDialog from "./DeckDeleteDialog";
import DeckEditDialog from "./DeckEditDialog";
import { RagUpload } from "./RagUpload";
import { getCardsByDeck } from "@/api/cards";
import { exportToApkg, downloadApkg } from "@/lib/ankiExport";
import { toast } from "sonner";

interface DeckActionsDialogProps {
    deck: Deck;
    cardsDue: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeckUpdated?: () => void;
}

const DeckActionsDialog = ({
    deck,
    cardsDue,
    open,
    onOpenChange,
    onDeckUpdated,
}: DeckActionsDialogProps) => {
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const handleStudy = () => {
        onOpenChange(false);
        navigate(`/deck/${deck.id}/study`);
    };

    const handleAddCards = () => {
        onOpenChange(false);
        navigate(`/deck/${deck.id}/newcard`, {
            state: { deckId: deck.id, deckName: deck.name },
        });
    };

    const handleManageCards = () => {
        onOpenChange(false);
        navigate(`/deck/${deck.id}/manage`);
    };

    const handleEdit = () => {
        onOpenChange(false);
        setEditDialogOpen(true);
    };

    const handleDelete = () => {
        onOpenChange(false);
        setDeleteDialogOpen(true);
    };

    const handleExport = async () => {
        onOpenChange(false);
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

    const handleUpload = () => {
        onOpenChange(false);
        setUploadDialogOpen(true);
    };

    const handleDeleteSuccess = () => {
        setDeleteDialogOpen(false);
        onDeckUpdated?.();
    };

    const handleEditSuccess = () => {
        setEditDialogOpen(false);
        onDeckUpdated?.();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-center">
                            {deck.name}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 text-center">
                            {cardsDue > 0
                                ? `${cardsDue} card${cardsDue !== 1 ? "s" : ""} due for review`
                                : "No cards due for review"}
                        </p>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <Button
                            variant="default"
                            className="flex flex-col items-center justify-center h-20 gap-1.5"
                            onClick={handleStudy}
                        >
                            <BookOpen className="h-5 w-5" />
                            <span className="text-xs">Study</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-20 gap-1.5"
                            onClick={handleAddCards}
                        >
                            <Plus className="h-5 w-5" />
                            <span className="text-xs">Add Cards</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-20 gap-1.5"
                            onClick={handleManageCards}
                        >
                            <TableProperties className="h-5 w-5" />
                            <span className="text-xs">Manage</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-20 gap-1.5"
                            onClick={handleEdit}
                        >
                            <Edit className="h-5 w-5" />
                            <span className="text-xs">Edit Deck</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-20 gap-1.5"
                            onClick={handleExport}
                        >
                            <Download className="h-5 w-5" />
                            <span className="text-xs">Export</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-20 gap-1.5"
                            onClick={handleUpload}
                        >
                            <Upload className="h-5 w-5" />
                            <span className="text-xs">Upload PDF</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-20 gap-1.5 col-span-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDelete}
                        >
                            <Trash className="h-5 w-5" />
                            <span className="text-xs">Delete Deck</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeckDeleteDialog
                deck={deck}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onSuccess={handleDeleteSuccess}
            />

            <DeckEditDialog
                mode="edit"
                deck={deck}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={handleEditSuccess}
            />

            <RagUpload
                deckId={deck.id}
                deckName={deck.name}
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
            />
        </>
    );
};

export default DeckActionsDialog;
