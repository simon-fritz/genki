import { SlidersHorizontal } from "lucide-react";

interface SettingsTagButtonProps {
    onClick?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    disabled?: boolean;
    className?: string;
}

const SettingsTagButton = ({
    onClick,
    onFocus,
    onBlur,
    disabled = false,
    className = "",
}: SettingsTagButtonProps) => {
    const disabledStyle = disabled
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer";
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 px-1.5 py-[0.05rem] text-xs text-black bg-white border border-gray-300 rounded-full transition-colors hover:bg-gray-100 ${disabledStyle} ${className}`}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={disabled}
        >
            <SlidersHorizontal className="w-3 h-3" />
            preferences
        </button>
    );
};

export default SettingsTagButton;
