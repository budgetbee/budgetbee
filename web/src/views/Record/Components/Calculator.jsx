import React, { useState } from "react";

export default function Calculator({ value, setValue }) {
    const [currentValue, setCurrentValue] = useState(0);

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
        setCurrentValue((prevValue) => {
            let newValue = prevValue.toString() + keyValue;
            newValue = keyValue !== "0" ? parseFloat(newValue) : newValue;
            newValue = keyValue === "0" && prevValue === 0 ? 0 : newValue;
            setValue(newValue);
            return newValue;
        });
    };

    const handleDotClick = () => {
        if (!String(currentValue).includes(".")) {
            const newValue = currentValue + ".";
            setValue(newValue);
            setCurrentValue(newValue);
        }
    };

    const handleDeleteClick = () => {
        const newValue = String(currentValue).slice(0, -1);
        setValue(newValue);
        setCurrentValue(Number(newValue));
    };

    const keys = [
        { key: 7, type: "number", text: "7" },
        { key: 8, type: "number", text: "8" },
        { key: 9, type: "number", text: "9" },
        { key: 4, type: "number", text: "4" },
        { key: 5, type: "number", text: "5" },
        { key: 6, type: "number", text: "6" },
        { key: 1, type: "number", text: "1" },
        { key: 2, type: "number", text: "2" },
        { key: 3, type: "number", text: "3" },
        { key: "dot", type: "dot", text: "." },
        { key: 0, type: "number", text: "0" },
        { key: "delete", type: "delete", text: "Del" },
    ];

    return (
        <div
            className="flex flex-row h-full bg-black text-center text-4xl text-gray-400"
            onClick={handleClick}
        >
            <div className="grow grid grid-cols-3 bg-gray-900">
                {keys.map((number) => (
                    <div
                        key={number.key}
                        data-key-type={number.type}
                        data-key={number.key}
                        className="flex h-full"
                    >
                        <div
                            data-key-type={number.type}
                            data-key={number.key}
                            className="m-auto"
                        >
                            {number.text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
