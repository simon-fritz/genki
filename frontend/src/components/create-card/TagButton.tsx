interface TagButtonProps {
    text: string;
    onClick?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    enabled: boolean;
    disabled?: boolean;
    className?: string;
}

const TagButton = ({
    text,
    onClick,
    onFocus,
    onBlur,
    enabled,
    disabled = false,
    className = "",
}: TagButtonProps) => {
    const stateBasedStyle = enabled ? "bg-[#7b7b8f]" : "bg-gray-300";
    const hoverStyle = disabled
        ? ""
        : enabled
          ? "hover:bg-gray-700"
          : "hover:bg-gray-400";
    const disabledStyle = disabled
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer";
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 px-1.5 py-[0.05rem] text-xs text-white rounded-full transition-colors ${stateBasedStyle} ${hoverStyle} ${disabledStyle} ${className}`}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={disabled}
        >
            {text}
        </button>
    );
};

export default TagButton;
