import React from "react";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function TopNav() {
    
    return (
        <div className="fixed w-full flex flex-row h-14 justify-left items-center bg-gray-700 z-40">
            <div
                className="py-3 pl-5 pr-10 cursor-pointer"
                onClick={() => window.history.back()}
            >
                <FontAwesomeIcon
                    icon={faArrowLeft}
                    className={"text-white text-2xl"}
                />
            </div>
        </div>
    );
}
