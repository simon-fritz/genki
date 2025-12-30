import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type IconType = ForwardRefExoticComponent<
    LucideProps & RefAttributes<SVGSVGElement>
>;

interface SubtleButtonProps {
    icon: IconType;
    text: string;
    onClick?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    fill?: boolean;
    className?: string;
}

const SubtleButton = ({
    icon: Icon,
    text,
    onClick,
    onFocus,
    onBlur,
    fill = false,
    className = "",
}: SubtleButtonProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 rounded bg-transparent hover:bg-black/5 transition-colors cursor-pointer ${className}`}
            onFocus={onFocus}
            onBlur={onBlur}
        >
            <Icon
                fillOpacity={fill ? 1 : 0}
                fill={fill ? "currentColor" : undefined}
                className="h-3 w-3"
            />
            {text}
        </button>
    );
};

export { SubtleButton };
