import React, { useState } from "react";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import FloatMenuOptions from "./Components/FloatMenuOptions";

export default function FloatMenu() {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="fixed bottom-24 right-5 z-40">
            {isOpen && <FloatMenuOptions />}
            <div className="rounded-full bg-blue-500" onClick={handleClick}>
                <FontAwesomeIcon icon={faPlus} className={"text-white text-4xl p-5"} />
            </div>
        </div>
    );
}
