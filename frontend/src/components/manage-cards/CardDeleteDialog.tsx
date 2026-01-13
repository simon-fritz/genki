import { useState } from "react";
import { type Card } from "@/api/cards";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/client";

interface CardDeleteDialogProps {
    card: Card | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CardDeleteDialog({
    card,
    onOpenChange,
    onSuccess,
}: CardDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!card) return;

        setIsDeleting(true);
        try {
            await api.delete(`/cards/${card.id}/`);
            toast.success("Card deleted successfully");
            onOpenChange(false);
            onSuccess();
        } catch (err) {
            console.error("Error deleting card:", err);
            toast.error("Failed to delete card");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={!!card} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Delete Card</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this card? This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                {card && (
                    <div className="my-4 p-4 bg-gray-50 rounded-lg space-y-2">
                        <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">
                                Front
                            </span>
                            <p className="text-sm text-gray-900 line-clamp-2">
                                {card.front}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">
                                Back
                            </span>
                            <p className="text-sm text-gray-900 line-clamp-2">
                                {card.back}
                            </p>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
