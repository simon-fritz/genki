import { SlidersHorizontal, User } from "lucide-react";
import { useNavigate } from "react-router";

const Header = () => {
    const navigate = useNavigate();

    return (
        <div className="py-2 flex w-full items-center">
            <p
                className="mr-4 text-2xl font-bold"
                onClick={() => {
                    navigate("/");
                }}
            >
                GenKi
            </p>
            {/* user and settings */}
            <div className="my-1 ml-auto flex">
                <SlidersHorizontal
                    onClick={() => {
                        navigate("/settings");
                    }}
                    className="mx-1 h-7 w-7"
                />
                <User className="ml-1 h-7 w-7" />
            </div>
        </div>
    );
};

export default Header;
