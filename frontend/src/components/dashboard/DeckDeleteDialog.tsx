import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteDeck } from "@/api/decks";
import type { Deck } from "@/api/decks";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface DeckDeleteDialogProps {
    deck: Deck;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

const DeckDeleteDialog = ({
    deck,
    open: controlledOpen,
    onOpenChange,
    onSuccess,
}: DeckDeleteDialogProps) => {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const handleDelete = async () => {
        try {
            await deleteDeck(deck.id);
            toast.success(`Successfully deleted the deck "${deck.name}".`);
            setOpen(false);
            onSuccess?.();
        } catch {
            toast.error("An error occurred while deleting the deck.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Deck</DialogTitle>
                    <DialogDescription>
                        <p className="my-2">
                            Are you sure you want to permanently delete the deck
                            "{deck.name}"?
                        </p>
                        <p className="my-2 text-red-800">
                            All associated cards will be deleted. This action
                            cannot be undone.
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Keep deck
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete deck
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeckDeleteDialog;
