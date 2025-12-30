import { useState } from "react";
import { ThumbsUp, RefreshCw, MessageSquare, Bot, BotOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";
import { Spinner } from "@/components/ui/spinner";

interface CardBacksideFieldProps {
    value: string;
    onChange: (value: string) => void;
    isGenerating?: boolean;
    completionsEnabled: boolean;
    onCompletionsToggle: () => void;
}

const CardBacksideField = ({
    value,
    onChange,
    isGenerating = false,
    completionsEnabled,
    onCompletionsToggle,
}: CardBacksideFieldProps) => {

    return (
        <FieldGroup>
            <Field>
                <FieldLabel className="flex items-center gap-2">
                    Back of the card
                    {isGenerating && <Spinner />}
                </FieldLabel>
                <Textarea
                    className="h-48"
                    placeholder="The answer or definition will be generated here"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={isGenerating}
                />
                <div className="flex justify-between -mt-2">
                    <SubtleButton
                        icon={completionsEnabled ? Bot : BotOff}
                        text={
                            completionsEnabled
                                ? "Completions on"
                                : "Completions off"
                        }
                        onClick={() =>
                            setCompletionsEnabled(!completionsEnabled)
                        }
                    />
                    {completionsEnabled && (
                        <div className="flex gap-1">
                            <SubtleButton icon={ThumbsUp} text="Helpful" />
                            <SubtleButton icon={RefreshCw} text="Regenerate" />
                            <SubtleButton icon={MessageSquare} text="Improve" />
                        </div>
                    )}
                </div>
            </Field>
        </FieldGroup>
    );
};

export default CardBacksideField;
