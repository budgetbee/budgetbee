import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDeleteLeft } from "@fortawesome/free-solid-svg-icons";

export default function Calculator({ value, setValue }) {
    const handleClick = (event) => {
        let keyValue = event.target.getAttribute("data-key");
        let keyType = event.target.getAttribute("data-key-type");

        if (keyType === "number") {
            handleNumberClick(keyValue);
        } else if (keyType === "dot") {
            handleDotClick();
        } else if (keyType === "delete") {
            handleDeleteClick();
        }
    };

    const handleNumberClick = (keyValue) => {
        setValue((prevValue) => {
            const strValue = String(prevValue);
            if (strValue === "0" && keyValue !== "0") {
                return Number(keyValue);
            }
            const newValue = strValue + keyValue;
            return newValue.includes(".") ? newValue : Number(newValue);
        });
    };

    const handleDotClick = () => {
        setValue((prevValue) => {
            if (!String(prevValue).includes(".")) {
                return String(prevValue) + ".";
            }
            return prevValue;
        });
    };

    const handleDeleteClick = () => {
        setValue((prevValue) => {
            const strValue = String(prevValue);
            const newValue = strValue.slice(0, -1);
            return newValue === "" ? 0 : newValue.includes(".") ? newValue : Number(newValue);
        });
    };

    const keys = [
        { key: 1, type: "number", text: "1" },
        { key: 2, type: "number", text: "2" },
        { key: 3, type: "number", text: "3" },
        { key: 4, type: "number", text: "4" },
        { key: 5, type: "number", text: "5" },
        { key: 6, type: "number", text: "6" },
        { key: 7, type: "number", text: "7" },
        { key: 8, type: "number", text: "8" },
        { key: 9, type: "number", text: "9" },
        { key: "dot", type: "dot", text: "." },
        { key: 0, type: "number", text: "0" },
        { key: "delete", type: "delete", text: "delete" },
    ];

    return (
        <div
            className="grid grid-cols-3 gap-1.5 px-3 h-full bg-[#0a0a0f] pb-3"
            onClick={handleClick}
        >
            {keys.map((key) => (
                <div
                    key={key.key}
                    data-key-type={key.type}
                    data-key={key.key}
                    className={`flex items-center justify-center rounded-2xl text-2xl font-medium cursor-pointer select-none transition-all active:scale-95 ${
                        key.type === "delete"
                            ? "bg-[#1a1a2e] text-gray-400"
                            : key.type === "dot"
                            ? "bg-[#1a1a2e] text-gray-300"
                            : "bg-[#1a1a2e] text-white"
                    }`}
                >
                    {key.type === "delete" ? (
                        <FontAwesomeIcon
                            icon={faDeleteLeft}
                            data-key-type={key.type}
                            data-key={key.key}
                            className="text-xl"
                        />
                    ) : (
                        <span data-key-type={key.type} data-key={key.key}>
                            {key.text}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
