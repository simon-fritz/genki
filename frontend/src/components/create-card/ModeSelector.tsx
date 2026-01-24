import { cn } from "@/lib/utils";
import { Zap, Target } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModeSelectorProps {
    mode: "rapid" | "accuracy";
    onModeChange: (mode: "rapid" | "accuracy") => void;
}

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
    return (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg h-10">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => onModeChange("rapid")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                                mode === "rapid"
                                    ? "bg-white text-blue-700 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900",
                            )}
                        >
                            <Zap className="w-4 h-4" />
                            <span>Rapid Mode</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>Fast generation using AI's general knowledge</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => onModeChange("accuracy")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                                mode === "accuracy"
                                    ? "bg-white text-green-700 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900",
                            )}
                        >
                            <Target className="w-4 h-4" />
                            <span>Accuracy Mode</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>
                            Uses your uploaded documents for more accurate,
                            context-specific answers
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

interface ModeSelectorWithDescriptionProps extends ModeSelectorProps {}

export const ModeSelectorWithDescription = ({
    mode,
    onModeChange,
}: ModeSelectorWithDescriptionProps) => {
    return <ModeSelector mode={mode} onModeChange={onModeChange} />;
};

export default ModeSelector;
