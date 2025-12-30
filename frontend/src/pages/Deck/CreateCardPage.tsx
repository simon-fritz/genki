import {
    useLocation,
    useNavigate,
    useParams,
    useBlocker,
} from "react-router-dom";
import { Info, Plus } from "lucide-react";
import CardFrontsideField from "@/components/create-card/CardFrontsideField";
import CardBacksideField from "@/components/create-card/CardBacksideField";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ExitConfirmationDialog from "@/components/create-card/ExitConfirmationDialog";
import { useState, useEffect, useRef, useCallback } from "react";
import { getDeck } from "@/api/decks.ts";
import { getBacksideRapidMode, getBacksideAccuracyMode } from "@/api/agent";
import { createCard } from "@/api/cards";
import { toast } from "sonner";
import type { BacksideResponse } from "@/api/agent";
import ChangedFrontsideConfirmationDialog from "@/components/create-card/ChangedFrontsideConfirmationDialog";

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
    const [changesSinceLastGeneration, setChangesSinceLastGeneration] =
        useState(true);
    const [responseMarkedHelpful, setResponseMarkedHelpful] = useState(false);
    const [lastFrontsidePrompt, setLastFrontsidePrompt] = useState("");
    const [generatedTextInBack, setGeneratedTextInBack] = useState(false);
    const [showChangedFrontsideDialog, setShowChangedFrontsideDialog] =
        useState(false);

    // Block navigation when there's unsaved content
    const hasUnsavedContent = !!(front.trim() || back.trim());
    const blocker = useBlocker(hasUnsavedContent);

    // Detect Mac for keyboard shortcut display
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    // Show exit dialog when navigation is blocked
    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowExitDialog(true);
        }
    }, [blocker.state]);

    // Show browser confirmation when closing tab/reloading
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedContent) {
                e.preventDefault();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedContent]);

    const handleSaveCard = useCallback(async () => {
        if (!deckId) {
            toast.error("Could not save the card: No deck selected.");
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
    }, [deckId, front, back]);

    const handleAddAndContinueClicked = useCallback(async () => {
        if (!front.trim() || !back.trim()) {
            toast.error("Please fill in both the front and back of the card.");
            return;
        }
        if (!deckId) {
            toast.error("No deck selected.");
            return;
        }
        if (
            generatedTextInBack &&
            front.trim() !== lastFrontsidePrompt.trim()
        ) {
            // the frontside has changed since last generation
            // potential mismatch of frontside and backside
            setShowChangedFrontsideDialog(true);
            return;
        }
        handleSaveCard();
    }, [
        front,
        back,
        deckId,
        generatedTextInBack,
        lastFrontsidePrompt,
        handleSaveCard,
    ]);

    // Ctrl+Enter to add and continue if card is not empty
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (front.trim() && back.trim()) {
                    handleAddAndContinueClicked();
                } else {
                    toast.info(
                        "Please fill in the front and back to save the card",
                    );
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [front, back, handleAddAndContinueClicked]);

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
        setLastFrontsidePrompt(front);
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
            setChangesSinceLastGeneration(false);
            setGeneratedTextInBack(true);
            setResponseMarkedHelpful(false);
        } catch {
            toast.error("Failed to generate backside. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveAndExit = async () => {
        if (!deckId) {
            toast.error("Could not save card: No deck selected.");
            return;
        }
        setIsSaving(true);
        try {
            await createCard({ deck: deckId, front, back });
            toast.success("Card saved successfully!");
            setShowExitDialog(false);
            // Clear content so blocker doesn't trigger again
            setFront("");
            setBack("");
            if (blocker.state === "blocked") {
                blocker.proceed();
            } else {
                navigate("/");
            }
        } catch {
            toast.error("Failed to save the card. Please try again.");
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
                    setChangesSinceLastGeneration(true);
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
                    setChangesSinceLastGeneration(true);
                    setGeneratedTextInBack(false);
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
                changesSinceLastGeneration={changesSinceLastGeneration}
                responseMarkedHelpful={responseMarkedHelpful}
                onResponseMarkedHelpfulToggle={() => {
                    /* Currently the "Helpful" button is not connected to any API endpoint */
                    setResponseMarkedHelpful((prev) => !prev);
                    toast.success("Your feedback has been recorded!");
                }}
            />
            <div className="flex justify-between items-center mt-4">
                <p className="text-gray-500 text-xs mt-1 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Cards will be saved to deck{" "}
                    {deckName ? `"${deckName}"` : <Spinner />}
                </p>
                <div className="flex flex-col items-end">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate("/")}>
                            Done
                        </Button>
                        <Button
                            variant={
                                front.trim() && back.trim()
                                    ? "default"
                                    : "disabled"
                            }
                            onClick={handleAddAndContinueClicked}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Spinner className="h-4 w-4 mr-1" />
                            ) : (
                                <Plus className="h-4 w-4 mr-1" />
                            )}
                            Add and continue
                        </Button>
                    </div>
                    {front.trim() && back.trim() && (
                        <p className="text-gray-500 text-xs mt-1">
                            <span className="inline-flex items-center gap-1">
                                {isMac ? "⌘+enter" : "ctrl+enter"}
                            </span>
                        </p>
                    )}
                </div>
            </div>

            <ChangedFrontsideConfirmationDialog
                open={showChangedFrontsideDialog}
                onOpenChange={setShowChangedFrontsideDialog}
                onKeepAsIs={async () => {
                    await handleSaveCard();
                    setShowChangedFrontsideDialog(false);
                }}
                frontsidePrompt={lastFrontsidePrompt}
                currentFrontside={front}
                isSaving={isSaving}
            />
            <ExitConfirmationDialog
                open={showExitDialog}
                onOpenChange={(open) => {
                    setShowExitDialog(open);
                    if (!open && blocker.state === "blocked") {
                        blocker.reset();
                    }
                }}
                onKeepEditing={() => {
                    setShowExitDialog(false);
                    if (blocker.state === "blocked") {
                        blocker.reset();
                    }
                }}
                onExitWithoutSaving={() => {
                    setShowExitDialog(false);
                    toast.info("Card discarded");
                    if (blocker.state === "blocked") {
                        blocker.proceed();
                    } else {
                        navigate("/");
                    }
                }}
                onSaveAndExit={handleSaveAndExit}
                isSaving={isSaving}
            />
        </div>
    );
};

export default CreateCardPage;
