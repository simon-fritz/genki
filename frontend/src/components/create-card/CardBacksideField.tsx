import { forwardRef } from "react";
import {
    ThumbsUp,
    RefreshCw,
    MessageSquare,
    Bot,
    BotOff,
    Lightbulb,
    ChevronsRight,
} from "lucide-react";
import {
    MarkdownEditor,
    type MarkdownEditorRef,
} from "@/components/ui/markdown-editor";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Info } from "lucide-react";

interface CardBacksideFieldProps {
    value: string;
    onChange: (value: string) => void;
    onRegenerate: () => void;
    isGenerating?: boolean;
    completionsEnabled: boolean;
    onCompletionsToggle: () => void;
    rapidModeEnabled: boolean;
    onRapidModeToggle: () => void;
    changesSinceLastGeneration?: boolean;
    responseMarkedHelpful: boolean;
    onResponseMarkedHelpfulToggle: () => void;
    showImprovementsPanel: boolean;
    onToggleImprovementsPanel: () => void;
}

const CardBacksideField = forwardRef<MarkdownEditorRef, CardBacksideFieldProps>(
    (
        {
            value,
            onChange,
            onRegenerate,
            isGenerating = false,
            completionsEnabled,
            onCompletionsToggle,
            rapidModeEnabled,
            onRapidModeToggle,
            changesSinceLastGeneration,
            responseMarkedHelpful,
            onResponseMarkedHelpfulToggle,
            showImprovementsPanel,
            onToggleImprovementsPanel,
        },
        ref,
    ) => {
        return (
            <FieldGroup>
                <Field>
                    <FieldLabel className="flex items-center gap-2">
                        Back of the card
                        {isGenerating && <Spinner />}
                    </FieldLabel>
                    <MarkdownEditor
                        ref={ref}
                        placeholder={
                            completionsEnabled
                                ? "The answer or definition will be generated here"
                                : "Enter backside of the card or enable completions to autogenerate"
                        }
                        value={value}
                        onChange={onChange}
                        disabled={isGenerating}
                    />
                    <div className="flex justify-between -mt-2 items-start">
                        <div className="flex gap-1">
                            <SubtleButton
                                icon={completionsEnabled ? Bot : BotOff}
                                text={
                                    completionsEnabled
                                        ? "Completions on"
                                        : "Completions off"
                                }
                                onClick={() => {
                                    const nowEnabled = !completionsEnabled;
                                    const subtext = nowEnabled
                                        ? "The backside of cards will be generated for you"
                                        : "To generate answers with AI, reenable completions";
                                    toast(
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3 h-8" />
                                                <p>
                                                    AI completions{" "}
                                                    {nowEnabled
                                                        ? "enabled"
                                                        : "disabled"}
                                                    .
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {subtext}
                                            </p>
                                        </>,
                                    );
                                    onCompletionsToggle();
                                }}
                            />
                            {completionsEnabled && (
                                <SubtleButton
                                    icon={
                                        rapidModeEnabled
                                            ? ChevronsRight
                                            : Lightbulb
                                    }
                                    text={
                                        rapidModeEnabled
                                            ? "Rapid mode"
                                            : "Accuracy mode"
                                    }
                                    onClick={() => {
                                        const nowRapid = !rapidModeEnabled;
                                        const toptext = nowRapid ? (
                                            <p>
                                                Now using <b>rapid mode</b>.
                                            </p>
                                        ) : (
                                            <p>
                                                Now using <b>accuracy mode</b>.
                                            </p>
                                        );
                                        const subtext = nowRapid
                                            ? "Cards will be generated without specialized knowledge.\nTags and preferences will be ignored."
                                            : "Uploaded files will be consulted to give better answers";
                                        toast(
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <Info className="w-3 h-8" />
                                                    {toptext}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {subtext}
                                                </p>
                                            </>,
                                        );
                                        onRapidModeToggle();
                                    }}
                                />
                            )}
                        </div>
                        {!changesSinceLastGeneration && completionsEnabled && (
                            <div className="flex gap-1 items-start">
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
                                <div
                                    className={`m-0 p-0 ${showImprovementsPanel ? "pb-2 -mb-1 bg-gray-100 rounded-t" : ""}`}
                                >
                                    <SubtleButton
                                        icon={MessageSquare}
                                        text="Ask for improvements"
                                        onClick={onToggleImprovementsPanel}
                                        className={
                                            showImprovementsPanel
                                                ? "bg-gray-100"
                                                : ""
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Field>
            </FieldGroup>
        );
    },
);

export default CardBacksideField;
