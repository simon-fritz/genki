import { CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";

interface CardFrontsideFieldProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

const CardFrontsideField = ({
    value,
    onChange,
    onSubmit,
}: CardFrontsideFieldProps) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <FieldGroup className="mt-4">
            <Field>
                <FieldLabel>Front of the card</FieldLabel>
                <Input
                    placeholder="Enter a question or vocabulary term"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="flex justify-end -mt-2">
                    <SubtleButton
                        icon={CornerDownLeft}
                        text="Submit"
                        onClick={onSubmit}
                    />
                </div>
            </Field>
        </FieldGroup>
    );
};

export default CardFrontsideField;
