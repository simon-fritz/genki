import { useRef, useEffect, useState } from "react";
import { CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";
import TagButton from "@/components/create-card/TagButton";
import { getPreferences, updatePreferences } from "@/api/preferences.ts";
import type { Preferences } from "@/api/preferences.ts";
import { toast } from "sonner";

interface CardFrontsideFieldProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isGenerating: boolean;
    completionsEnabled: boolean;
    rapidModeEnabled: boolean;
}

interface Tags {
    verbose: boolean;
    concise: boolean;
    example: boolean;
    mnemonic: boolean;
    paragraph: boolean;
    analogy: boolean;
    step_by_step: boolean;
    german: boolean;
}

const prefsToTags = (prefs: Preferences): Tags => {
    return {
        verbose: prefs.verbosity === "detailed",
        concise: prefs.verbosity === "concise",
        example: prefs.include_examples,
        mnemonic: prefs.include_mnemonic,
        paragraph: prefs.structure === "paragraph",
        analogy: prefs.include_analogies,
        step_by_step: prefs.step_by_step,
        german: prefs.language == "de",
    };
};

/* Only returns prefs assoiated with tags, i.e. Preferences object will miss some keys
 */
const tagsToPrefsPatch = (tags: Tags): Partial<Preferences> => {
    return {
        verbosity: tags.verbose
            ? "detailed"
            : tags.concise
              ? "concise"
              : "balanced",
        structure: tags.paragraph ? "paragraph" : "bullets",
        include_examples: tags.example,
        examples_per_answer: tags.example ? 1 : 0,
        include_analogies: tags.analogy,
        step_by_step: tags.step_by_step,
        include_mnemonic: tags.mnemonic,
        language: tags.german ? "de" : "en",
    };
};

const CardFrontsideField = ({
    value,
    onChange,
    onSubmit,
    isGenerating = false,
    completionsEnabled,
    rapidModeEnabled,
}: CardFrontsideFieldProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const wasFocusedRef = useRef(false);

    const [tagsLoading, setTagsLoading] = useState<boolean>(true);
    const [tags, setTags] = useState<Tags>({
        verbose: false,
        concise: false,
        example: false,
        mnemonic: false,
        paragraph: false,
        analogy: false,
        step_by_step: false,
        german: false,
    });

    const updateServerPreferences = async (nextTags: Tags): Promise<void> => {
        await updatePreferences({
            preferences: tagsToPrefsPatch(nextTags),
        });
    };

    const handleToggleTag = async (tag_name: keyof Tags) => {
        const prevTags = tags;

        const newTags = { ...tags, [tag_name]: !tags[tag_name] };
        // mutually exclusive tags
        if (tag_name === "concise" && !tags.concise) newTags.verbose = false;
        if (tag_name === "verbose" && !tags.verbose) newTags.concise = false;

        // Optimistically update UI
        setTags(newTags);

        // Try to update server, revert on failure
        try {
            await updateServerPreferences(newTags);
        } catch {
            toast.error("Preferences could not be updated.");
            setTags(prevTags);
        }
    };

    // get preferences once on load
    useEffect(() => {
        // just so that toast doesn't show twice in strict mode
        let cancelled = false;

        const fetchTagsFromServer = async () => {
            setTagsLoading(true);
            try {
                const response = await getPreferences();
                if (cancelled) return;
                setTags(prefsToTags(response.preferences));
                setTagsLoading(false);
            } catch {
                if (cancelled) return;
                toast.error("Could not fetch tags from server.");
            }
        };

        fetchTagsFromServer();
        return () => {
            cancelled = true;
        };
    }, []); // might need something else in the dependency array

    useEffect(() => {
        if (!isGenerating && wasFocusedRef.current) {
            inputRef.current?.focus();
        }
    }, [isGenerating]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <FieldGroup className="my-6">
            <Field>
                <FieldLabel>Front of the card</FieldLabel>
                <Input
                    ref={inputRef}
                    placeholder="Enter a question or vocabulary term"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => (wasFocusedRef.current = true)}
                    onBlur={() => {
                        if (!isGenerating) {
                            wasFocusedRef.current = false;
                        }
                    }}
                    disabled={isGenerating}
                />
                <div
                    className={`flex justify-between -mt-2 -mb-4 items-start ${completionsEnabled ? "" : "invisible"}`}
                >
                    <div
                        className={`flex gap-1 ${rapidModeEnabled ? "invisible" : ""}`}
                    >
                        {(Object.keys(tags) as (keyof Tags)[]).map((name) => (
                            <TagButton
                                key={name}
                                text={name.replace(/_/g, "-")}
                                enabled={tags[name]}
                                disabled={tagsLoading}
                                onClick={() => handleToggleTag(name)}
                            />
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <SubtleButton
                            icon={CornerDownLeft}
                            text="Generate backside"
                            onClick={onSubmit}
                            onFocus={() => (wasFocusedRef.current = true)}
                            onBlur={() => {
                                if (!isGenerating) {
                                    wasFocusedRef.current = false;
                                }
                            }}
                        />
                    </div>
                </div>
            </Field>
        </FieldGroup>
    );
};

export default CardFrontsideField;
