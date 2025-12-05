import { SlidersHorizontal, User } from "lucide-react";

const Header = () => {
    return (
        <div className="py-2 flex w-full items-center">
            <p className="mr-4 text-2xl font-bold">GenKi</p>
            {/* user and settings */}
            <div className="my-1 ml-auto flex">
                <SlidersHorizontal className="mx-1 h-7 w-7" />
                <User className="ml-1 h-7 w-7" />
            </div>
        </div>
    );
};

export default Header;
