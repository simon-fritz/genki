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

interface ChangedFrontsideConfirmationDialog {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onKeepAsIs: () => void;
    frontsidePrompt: string;
    currentFrontside: string;
    isSaving: boolean;
}

const ChangedFrontsideConfirmationDialog = ({
    open,
    onOpenChange,
    onKeepAsIs,
    frontsidePrompt,
    currentFrontside,
    isSaving,
}: ChangedFrontsideConfirmationDialog) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Possible mismatch in card</DialogTitle>
                    <DialogDescription>
                        The backside of the card was generated with the prompt "
                        {frontsidePrompt}", but you have since changed the
                        frontside to "{currentFrontside}".
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Keep editing
                    </Button>
                    <Button onClick={onKeepAsIs} disabled={isSaving}>
                        {isSaving && <Spinner className="h-4 w-4 mr-1" />}
                        Save the card as-is
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChangedFrontsideConfirmationDialog;
