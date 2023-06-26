import React, { useState } from "react";
import { Link } from "react-router-dom";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCar,
    faGasPump,
    faScrewdriverWrench,
    faPencil,
} from "@fortawesome/free-solid-svg-icons";

export default function FloatMenuOptions() {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-48 right-5 z-40 rounded-xl border bg-gray-100 p-4 text-lg">
            <div className="flex flex-col gap-y-2">
                <Link to="/record">
                    <div className="rounded-xl bg-red-400 text-white p-3">
                        <FontAwesomeIcon
                            icon={faCar}
                            className={"text-white"}
                        />{" "}
                        Nuevo
                    </div>
                </Link>
            </div>
        </div>
    );
}
