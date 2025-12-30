import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface ImprovementsPanelProps {
    show: boolean;
    onSubmit: (feedback: string) => Promise<void>;
    isSubmitting: boolean;
}

const ImprovementsPanel = ({
    show,
    onSubmit,
    isSubmitting,
}: ImprovementsPanelProps) => {
    const [feedback, setFeedback] = useState("");

    if (!show) return null;

    const handleSubmit = async () => {
        if (feedback.trim() && !isSubmitting) {
            await onSubmit(feedback);
            setFeedback("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="bg-gray-100 rounded-lg rounded-tr-none p-4">
            <p className="text-sm text-gray-600 mb-2">
                What would you like to improve about the generated response?
            </p>
            <div className="flex">
                <Input
                    className="bg-white flex-1 rounded-r-none border-r-0"
                    placeholder="e.g. make it shorter, give examples, simplify the language..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                />
                <Button
                    variant="outline"
                    className="rounded-l-none"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !feedback.trim()}
                >
                    {isSubmitting ? (
                        <Spinner className="h-4 w-4" />
                    ) : (
                        <SendHorizontal className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
};

export default ImprovementsPanel;
