import { SlidersHorizontal, User, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { getAccessToken, clearTokens } from "@/api/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import logoIcon from "@/assets/logo_icon.png";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we're on the create card page (matches /deck/:id/newcard)
    const isCreateCardPage = /^\/deck\/[^/]+\/newcard$/.test(location.pathname);

    const username = (() => {
        try {
            const user = localStorage.getItem("user");
            if (user) {
                return JSON.parse(user).username || null;
            }
        } catch {
            // Ignore parse errors
        }
        return null;
    })();

    return (
        <div className="border-b border-gray-200 bg-white py-0 flex w-full items-center px-6 pt-3 pb-2">
            <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                    navigate("/");
                }}
            >
                <img
                    src={logoIcon}
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
                            navigate("/settings", {
                                state: isCreateCardPage
                                    ? { fromCreateCardPage: true }
                                    : undefined,
                            });
                        }}
                        className="mx-1 h-7 w-7 cursor-pointer"
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
                            <DropdownMenuLabel className="font-normal">
                                <p className="text-xs text-muted-foreground">
                                    Hello,
                                </p>
                                <p className="font-medium">{username}</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
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
