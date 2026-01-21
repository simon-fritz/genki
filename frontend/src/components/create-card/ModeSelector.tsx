import { cn } from "@/lib/utils";
import { Zap, Target } from "lucide-react";

interface ModeSelectorProps {
    mode: "rapid" | "accuracy";
    onModeChange: (mode: "rapid" | "accuracy") => void;
    accuracyModeAvailable: boolean;
}

const ModeSelector = ({
    mode,
    onModeChange,
    accuracyModeAvailable,
}: ModeSelectorProps) => {
    return (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
                type="button"
                onClick={() => onModeChange("rapid")}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    mode === "rapid"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                )}
            >
                <Zap className="w-4 h-4" />
                <span>Rapid</span>
            </button>
            <button
                type="button"
                onClick={() => accuracyModeAvailable && onModeChange("accuracy")}
                disabled={!accuracyModeAvailable}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    mode === "accuracy"
                        ? "bg-white text-green-700 shadow-sm"
                        : accuracyModeAvailable
                          ? "text-gray-600 hover:text-gray-900"
                          : "text-gray-400 cursor-not-allowed"
                )}
                title={
                    !accuracyModeAvailable
                        ? "Upload documents to enable accuracy mode"
                        : undefined
                }
            >
                <Target className="w-4 h-4" />
                <span>Accuracy</span>
            </button>
        </div>
    );
};

interface ModeSelectorWithDescriptionProps extends ModeSelectorProps {}

export const ModeSelectorWithDescription = ({
    mode,
    onModeChange,
    accuracyModeAvailable,
}: ModeSelectorWithDescriptionProps) => {
    return (
        <div className="space-y-3">
            <ModeSelector
                mode={mode}
                onModeChange={onModeChange}
                accuracyModeAvailable={accuracyModeAvailable}
            />
            <p className="text-xs text-gray-500">
                {mode === "rapid" ? (
                    <>
                        <strong>Fast generation</strong> using AI's general knowledge. 
                        Best for common topics and quick card creation.
                    </>
                ) : (
                    <>
                        <strong>Uses your uploaded documents</strong> for more accurate, 
                        context-specific answers. Best for specialized topics.
                    </>
                )}
            </p>
            {!accuracyModeAvailable && (
                <p className="text-xs text-amber-600">
                    💡 Upload documents to your deck to unlock Accuracy mode
                </p>
            )}
        </div>
    );
};

export default ModeSelector;
