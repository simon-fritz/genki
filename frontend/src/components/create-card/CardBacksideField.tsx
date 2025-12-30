import { type Ref } from "react";
import {
    ThumbsUp,
    RefreshCw,
    MessageSquare,
    Bot,
    BotOff,
    Lightbulb,
    ChevronsRight,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface CardBacksideFieldProps {
    value: string;
    onChange: (value: string) => void;
    onRegenerate: () => void;
    isGenerating?: boolean;
    completionsEnabled: boolean;
    onCompletionsToggle: () => void;
    rapidModeEnabled: boolean;
    onRapidModeToggle: () => void;
    backsideTextareaRef?: Ref<HTMLTextAreaElement>;
    changesSinceLastGeneration?: boolean;
    responseMarkedHelpful: boolean;
    onResponseMarkedHelpfulToggle: () => void;
}

const CardBacksideField = ({
    value,
    onChange,
    onRegenerate,
    isGenerating = false,
    completionsEnabled,
    onCompletionsToggle,
    rapidModeEnabled,
    onRapidModeToggle,
    backsideTextareaRef,
    changesSinceLastGeneration,
    responseMarkedHelpful,
    onResponseMarkedHelpfulToggle,
}: CardBacksideFieldProps) => {
    return (
        <FieldGroup>
            <Field>
                <FieldLabel className="flex items-center gap-2">
                    Back of the card
                    {isGenerating && <Spinner />}
                </FieldLabel>
                <Textarea
                    ref={backsideTextareaRef}
                    className="h-48"
                    placeholder={
                        completionsEnabled
                            ? "The answer or definition will be generated here"
                            : "Enter backside of the card or enable completions to autogenerate"
                    }
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={isGenerating}
                />
                <div className="flex justify-between -mt-2">
                    <div className="flex gap-1">
                        <SubtleButton
                            icon={completionsEnabled ? Bot : BotOff}
                            text={
                                completionsEnabled
                                    ? "Completions on"
                                    : "Completions off"
                            }
                            onClick={() => {
                                toast.info(
                                    completionsEnabled ? (
                                        <p>
                                            AI completions disabled.
                                            <br />
                                            <br />
                                            To generate answers with AI,
                                            reenable completions.
                                        </p>
                                    ) : (
                                        <p>
                                            AI completions enabled.
                                            <br />
                                            <br />
                                            The backside of cards will be
                                            generated for you.
                                        </p>
                                    ),
                                );
                                onCompletionsToggle();
                            }}
                        />
                        {completionsEnabled && (
                            <SubtleButton
                                icon={
                                    rapidModeEnabled ? ChevronsRight : Lightbulb
                                }
                                text={
                                    rapidModeEnabled
                                        ? "Rapid mode"
                                        : "Accuracy mode"
                                }
                                onClick={() => {
                                    toast.info(
                                        rapidModeEnabled ? (
                                            <p>
                                                Now using <b>accuracy mode</b>.
                                                <br />
                                                <br />
                                                Uploaded files will be consulted
                                                to provide better answers.
                                            </p>
                                        ) : (
                                            <p>
                                                Now using <b>rapid mode</b>.
                                                <br />
                                                <br />
                                                Cards will be generated without
                                                specialized knowledge.
                                            </p>
                                        ),
                                    );
                                    onRapidModeToggle();
                                }}
                            />
                        )}
                    </div>
                    {!changesSinceLastGeneration && completionsEnabled && (
                        <div className="flex gap-1">
                            <SubtleButton
                                icon={ThumbsUp}
                                fill={responseMarkedHelpful}
                                text="Helpful"
                                onClick={onResponseMarkedHelpfulToggle}
                            />
                            <SubtleButton
                                icon={RefreshCw}
                                text="Regenerate"
                                onClick={onRegenerate}
                            />
                            <SubtleButton
                                icon={MessageSquare}
                                text="Ask for improvements"
                            />
                        </div>
                    )}
                </div>
            </Field>
        </FieldGroup>
    );
};

export default CardBacksideField;
