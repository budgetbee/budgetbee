import React, { useState } from "react";
import { Link } from "react-router-dom";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

export default function FloatMenu() {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-10 right-10 z-40">
            <Link to="/record">
                <div className="flex items-center rounded-full w-20 h-20 bg-[#C3D4E6] drop-shadow" onClick={handleClick}>
                    <FontAwesomeIcon
                        icon={faPlus}
                        className={"text-gray-800 m-auto text-4xl"}
                    />
                </div>
            </Link>
        </div>
    );
}
