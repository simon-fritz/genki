import { SlidersHorizontal, User } from "lucide-react";
import { useNavigate } from "react-router";

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
            <div className="my-1 ml-auto flex">
                <SlidersHorizontal
                    onClick={() => {
                        navigate("/settings");
                    }}
                    className="mx-1 h-7 w-7"
                />
                <User
                    onClick={() => navigate('/login')}
                    className="ml-1 h-7 w-7 cursor-pointer"
                    role="button"
                    aria-label="Account"
                />
            </div>
        </div>
    );
};

export default Header;
