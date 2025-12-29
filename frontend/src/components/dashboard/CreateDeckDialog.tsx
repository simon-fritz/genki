import { useState } from "react";
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
import CreateDeckButton from "./CreateDeckButton";
import { createDeck } from "@/api/decks";
import { toast } from "sonner";

interface CreateDeckDialogProps {
    onDeckCreated?: () => void;
}

const CreateDeckDialog = ({ onDeckCreated }: CreateDeckDialogProps) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async () => {
        if (!name.trim()) return;
        try {
            await createDeck({ name, description });
            setName("");
            setDescription("");
            setOpen(false);
            // call onDeckCreated (passed down from Dashboard) to refresh deck list after creating new deck
            onDeckCreated?.();
        } catch {
            toast.error(
                "An error occurred while creating the deck. Please try again.",
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateDeckButton />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Deck</DialogTitle>
                    <DialogDescription>
                        Enter a name and description for your new deck.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Deck name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
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
                    <Button onClick={handleSubmit}>Create Deck</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateDeckDialog;
