import { useRef, useEffect } from "react";
import { CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";

interface CardFrontsideFieldProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isGenerating: boolean;
    completionsEnabled: boolean;
}

const CardFrontsideField = ({
    value,
    onChange,
    onSubmit,
    isGenerating = false,
    completionsEnabled,
}: CardFrontsideFieldProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const wasFocusedRef = useRef(false);

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
                    className={`flex justify-end -mt-2 -mb-6 ${completionsEnabled ? "" : "invisible"}`}
                >
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
            </Field>
        </FieldGroup>
    );
};

export default CardFrontsideField;
