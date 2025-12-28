import { SlidersHorizontal, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { getAccessToken, clearTokens } from "@/api/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const Header = () => {
    const navigate = useNavigate();

    return (
        <div className="border-b border-gray-200 bg-white py-4 flex w-full items-center px-6">
            <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                    navigate("/");
                }}
            >
                <img
                    src="/logo.png"
                    alt="Anki GenAI Logo"
                    className="h-14 w-auto"
                />
                <p className="text-2xl font-bold text-gray-900">GenKi</p>
            </div>
            {/* user and settings */}
            {getAccessToken() ? (
                <div className="my-1 ml-auto flex">
                    <SlidersHorizontal
                        onClick={() => {
                            navigate("/settings");
                        }}
                        className="mx-1 h-7 w-7"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <User
                                className="ml-1 h-7 w-7 cursor-pointer"
                                role="button"
                                aria-label="Account"
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={() => {
                                    clearTokens();
                                    toast.success("Logged out successfully");
                                    navigate("/login");
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ) : null}
        </div>
    );
};

export default Header;
