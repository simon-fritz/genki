import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createDeck, updateDeck } from "@/api/decks";
import type { Deck } from "@/api/decks";
import { toast } from "sonner";
import axios from "axios";

interface DeckEditDialogProps {
    mode: "create" | "edit";
    deck?: Deck;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

const DeckEditDialog = ({
    mode,
    deck,
    trigger,
    open: controlledOpen,
    onOpenChange,
    onSuccess,
}: DeckEditDialogProps) => {
    const navigate = useNavigate();
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const [name, setName] = useState(deck?.name || "");
    const [description, setDescription] = useState(deck?.description || "");

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Please enter a name for the deck.");
            return;
        }
        try {
            if (mode === "create") {
                const createdDeck = await createDeck({ name, description });
                toast.success(`Successfully created the deck "${name}"!`, {
                    action: {
                        label: "Add Cards",
                        onClick: () =>
                            navigate(`/deck/${createdDeck.id}/newcard`, {
                                state: {
                                    deckId: createdDeck.id,
                                    deckName: createdDeck.name,
                                },
                            }),
                    },
                });
                setName("");
                setDescription("");
            } else {
                await updateDeck({ name, description }, deck!.id);
                toast.success(`Successfully updated the deck "${name}"!`);
            }
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                toast.error("A deck with that name already exists.");
            } else {
                toast.error(
                    mode === "create"
                        ? "An error occurred while creating the deck."
                        : "An error occurred while updating the deck.",
                );
            }
        }
    };

    const isCreate = mode === "create";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isCreate ? "Create New Deck" : "Edit Deck"}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreate
                            ? "Enter a name and description for your new deck."
                            : "Update the name and description for your deck."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        {!isCreate && deck?.name && (
                            <p className="text-sm text-gray-500">
                                Previous: {deck.name}
                            </p>
                        )}
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Deck name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        {!isCreate && deck?.description && (
                            <p className="text-sm text-gray-500">
                                Previous: {deck.description}
                            </p>
                        )}
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this deck about?"
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>
                        {isCreate ? "Create Deck" : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeckEditDialog;
