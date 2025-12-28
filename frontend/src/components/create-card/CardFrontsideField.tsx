import { CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubtleButton } from "@/components/create-card/SubtleButton";

const CardFrontsideField = () => {
    return (
        <FieldGroup className="my-2">
            <Field>
                <FieldLabel>Front of the card</FieldLabel>
                <Input
                    className="mt-2 mb-2"
                    placeholder="Enter a question or vocabulary term"
                />
                <div className="flex justify-end">
                    <SubtleButton icon={CornerDownLeft} text="Submit" />
                </div>
            </Field>
        </FieldGroup>
    );
};

export default CardFrontsideField;
