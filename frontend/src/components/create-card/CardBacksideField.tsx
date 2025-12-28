import { useState } from "react";
import { ThumbsUp, RefreshCw, MessageSquare, Bot, BotOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";

const CardBacksideField = () => {
    const [completionsEnabled, setCompletionsEnabled] = useState(true);

    return (
        <FieldGroup className="my-2">
            <Field>
                <FieldLabel>Back of the card</FieldLabel>
                <Textarea
                    className="h-48 mt-2 mb-2"
                    placeholder="The answer or definition will be generated here"
                />
                <div className="flex justify-between">
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
