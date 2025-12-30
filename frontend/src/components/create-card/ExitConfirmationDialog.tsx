import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ExitConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onKeepEditing: () => void;
    onExitWithoutSaving: () => void;
    onSaveAndExit: () => void;
    isSaving: boolean;
}

const ExitConfirmationDialog = ({
    open,
    onOpenChange,
    onKeepEditing,
    onExitWithoutSaving,
    onSaveAndExit,
    isSaving,
}: ExitConfirmationDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unsaved card</DialogTitle>
                    <DialogDescription>
                        You have an unsaved card. What would you like to do?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={onKeepEditing}>
                        Keep editing
                    </Button>
                    <Button variant="destructive" onClick={onExitWithoutSaving}>
                        Exit without saving
                    </Button>
                    <Button onClick={onSaveAndExit} disabled={isSaving}>
                        {isSaving && <Spinner className="h-4 w-4 mr-1" />}
                        Save card and exit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExitConfirmationDialog;
