import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/api/client";
import type { Card } from "@/api/cards";

interface EditCardModalProps {
    card: Card;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EditCardModal({
    card,
    open,
    onOpenChange,
    onSuccess,
}: EditCardModalProps) {
    const [front, setFront] = useState(card.front);
    const [back, setBack] = useState(card.back);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form when card changes
    useEffect(() => {
        setFront(card.front);
        setBack(card.back);
    }, [card]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!front.trim() || !back.trim()) {
            toast.error("Both front and back must be filled");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put(`/cards/${card.id}/`, {
                front: front.trim(),
                back: back.trim(),
                deck: card.deck,
            });
            toast.success("Card updated successfully");
            onSuccess();
        } catch (err) {
            console.error("Error updating card:", err);
            toast.error("Failed to update card");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Card</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="front">Front</Label>
                        <Textarea
                            id="front"
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            placeholder="Enter the front of the card"
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="back">Back</Label>
                        <Textarea
                            id="back"
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            placeholder="Enter the back of the card"
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
