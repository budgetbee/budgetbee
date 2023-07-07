import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function TopNav({
    leftFunction,
    leftIcon,
    rightFunction,
    rightIcon,
}) {
    const handleLeftClick = () => {
        if (leftFunction) {
            leftFunction();
        } else {
            window.history.back();
        }
    };

    const handleRightClick = () => {
        if (rightFunction) {
            rightFunction();
        } else {
            window.history.back();
        }
    };

    return (
        <div className="fixed w-full flex flex-row h-14 justify-between items-center bg-gray-700 z-40">
            <div
                className="py-3 pl-5 pr-10 cursor-pointer"
                onClick={handleLeftClick}
            >
                <FontAwesomeIcon
                    icon={leftIcon || faArrowLeft}
                    className="text-white text-2xl"
                />
            </div>
            {rightFunction && (
                <div
                    className="py-3 pl-5 pr-10 cursor-pointer"
                    onClick={handleRightClick}
                >
                    <FontAwesomeIcon
                        icon={rightIcon}
                        className="text-white text-2xl"
                    />
                </div>
            )}
        </div>
    );
}
