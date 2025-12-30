import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import CardFrontsideField from "@/components/create-card/CardFrontsideField";
import CardBacksideField from "@/components/create-card/CardBacksideField";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ExitConfirmationDialog from "@/components/create-card/ExitConfirmationDialog";
import { useState, useEffect, useRef } from "react";
import { getDeck } from "@/api/decks.ts";
import { getBacksideRapidMode, getBacksideAccuracyMode } from "@/api/agent";
import { createCard } from "@/api/cards";
import { toast } from "sonner";
import type { BacksideResponse } from "@/api/agent";

const CreateCardPage = () => {
    const navigate = useNavigate();

    // get deckId from url parameter
    const { deckId } = useParams();

    // try getting deck name from location state
    const location = useLocation();
    const [deckName, setDeckName] = useState<string | null>(
        location.state?.deckName || null,
    );

    // Card content state
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [completionsEnabled, setCompletionsEnabled] = useState(true);
    const [rapidModeEnabled, setRapidModeEnabled] = useState(false);
    const backsideTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [generatedTextPresent, setGeneratedTextPresent] = useState(false);
    const [responseMarkedHelpful, setResponseMarkedHelpful] = useState(false);

    // this function will call the right api based on rapidModeEnabled
    // it assumes completions are enabled, so do not call this if you do not want a completion
    const handleGenerateBackside = async () => {
        if (!deckId) {
            toast.error("Could not generate backside: no deck selected.");
            return;
        }
        if (!front.trim()) {
            toast.error("Please enter the front of the card first.");
            return;
        }
        setIsGenerating(true);
        try {
            let response: BacksideResponse;
            if (rapidModeEnabled) {
                response = await getBacksideRapidMode({ front });
            } else {
                response = await getBacksideAccuracyMode({
                    front: front,
                    deck_id: deckId,
                });
            }
            setBack(response.back);
            setGeneratedTextPresent(true);
            setResponseMarkedHelpful(false);
        } catch {
            toast.error("Failed to generate backside. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDoneClick = () => {
        if (front.trim() && back.trim()) {
            setShowExitDialog(true);
        } else {
            navigate("/");
        }
    };

    const handleSaveAndExit = async () => {
        if (!deckId) {
            toast.error("No deck selected.");
            return;
        }
        setIsSaving(true);
        try {
            await createCard({ deck: deckId, front, back });
            toast.success("Card saved successfully!");
            setShowExitDialog(false);
            navigate("/");
        } catch {
            toast.error("Failed to save the card. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAndContinue = async () => {
        if (!front.trim() || !back.trim()) {
            toast.error("Please fill in both the front and back of the card.");
            return;
        }
        if (!deckId) {
            toast.error("No deck selected.");
            return;
        }
        setIsSaving(true);
        try {
            await createCard({ deck: deckId, front, back });
            toast.success("Card added successfully!");
            setFront("");
            setBack("");
        } catch {
            toast.error("The card could not be saved due to an error.");
        } finally {
            setIsSaving(false);
        }
    };

    // fall back to using API to get deck name if not stored in location state
    // i.e. happens when user types URL directly instead of accessing page from dashboard
    useEffect(() => {
        let cancelled = false;

        if (!deckId) {
            navigate("/");
            return;
        }
        if (!deckName) {
            getDeck(deckId)
                .then((deck) => {
                    if (!cancelled) setDeckName(deck.name);
                })
                .catch(() => {
                    if (!cancelled) {
                        toast.error("The selected deck couldn't be found.");
                        navigate("/");
                    }
                });
        }

        return () => {
            cancelled = true;
        };
    }, [deckId, deckName, navigate]);

    return (
        <div>
            <CardFrontsideField
                value={front}
                onChange={(val) => {
                    setFront(val);
                    setGeneratedTextPresent(false);
                    setResponseMarkedHelpful(false);
                }}
                onSubmit={
                    completionsEnabled
                        ? handleGenerateBackside
                        : () => backsideTextareaRef.current?.focus()
                }
                isGenerating={isGenerating}
                completionsEnabled={completionsEnabled}
            />
            <CardBacksideField
                backsideTextareaRef={backsideTextareaRef}
                value={back}
                onChange={(val) => {
                    setBack(val);
                    setGeneratedTextPresent(false);
                    setResponseMarkedHelpful(false);
                }}
                onRegenerate={handleGenerateBackside}
                isGenerating={isGenerating}
                completionsEnabled={completionsEnabled}
                onCompletionsToggle={() =>
                    setCompletionsEnabled((prev) => !prev)
                }
                rapidModeEnabled={rapidModeEnabled}
                onRapidModeToggle={() => {
                    setRapidModeEnabled((prev) => !prev);
                }}
                generatedTextPresent={generatedTextPresent}
                responseMarkedHelpful={responseMarkedHelpful}
                onResponseMarkedHelpfulToggle={() => {
                    /* Currently the "Helpful" button is not connected to any API endpoint */
                    setResponseMarkedHelpful((prev) => !prev);
                    toast.success("Your feedback has been recorded!");
                }}
            />
            <div className="flex flex-col items-end mt-4">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDoneClick}>
                        Done
                    </Button>
                    <Button onClick={handleAddAndContinue} disabled={isSaving}>
                        {isSaving ? (
                            <Spinner className="h-4 w-4 mr-1" />
                        ) : (
                            <Plus className="h-4 w-4 mr-1" />
                        )}
                        Add and continue
                    </Button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                    <span className="inline-flex items-center gap-1">
                        Card will be saved to deck{" "}
                        {deckName ? `"${deckName}"` : <Spinner />}
                    </span>
                </p>
            </div>

            <ExitConfirmationDialog
                open={showExitDialog}
                onOpenChange={setShowExitDialog}
                onKeepEditing={() => setShowExitDialog(false)}
                onExitWithoutSaving={() => {
                    setShowExitDialog(false);
                    toast("Card discarded");
                    navigate("/");
                }}
                onSaveAndExit={handleSaveAndExit}
                isSaving={isSaving}
            />
        </div>
    );
};

export default CreateCardPage;
