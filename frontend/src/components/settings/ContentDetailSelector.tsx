import { cn } from "@/lib/utils";

interface ContentDetailOption {
    value: string;
    label: string;
    description: string;
}

interface ContentDetailSelectorProps {
    label: string;
    value: string;
    options: ContentDetailOption[];
    onChange: (value: string) => void;
}

const ContentDetailSelector = ({
    label,
    value,
    options,
    onChange,
}: ContentDetailSelectorProps) => {
    // Dynamically set grid columns based on number of options
    const gridCols = options.length === 2 
        ? "grid-cols-2" 
        : options.length === 4 
            ? "grid-cols-2 sm:grid-cols-4" 
            : "grid-cols-3";

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium">{label}</label>
            <div className={`grid ${gridCols} gap-3`}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            value === option.value
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                        )}
                    >
                        <span
                            className={cn(
                                "font-medium text-sm mb-1",
                                value === option.value
                                    ? "text-blue-700"
                                    : "text-gray-900"
                            )}
                        >
                            {option.label}
                        </span>
                        <span
                            className={cn(
                                "text-xs text-center",
                                value === option.value
                                    ? "text-blue-600"
                                    : "text-gray-500"
                            )}
                        >
                            {option.description}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ContentDetailSelector;
