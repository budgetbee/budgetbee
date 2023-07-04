import React, { useEffect, useState } from "react";

export default function Calculator({ value, setValue }) {
    const [currentValue, setCurrentValue] = useState(0);
    const [total, setTotal] = useState(0);
    const [currentOperator, setCurrentOperator] = useState(null);

    const handleClick = (event) => {
        let keyValue = event.target.getAttribute("data-key");
        let keyType = event.target.getAttribute("data-key-type");

        if (keyType === "number") {
            handleNumberClick(keyValue);
        } else if (keyType === "operator") {
            handleOperatorClick(keyValue);
        } else if (keyType === "equal") {
            handleEqualClick();
        } else if (keyType === "comma") {
            handleCommaClick();
        } else if (keyType === "delete") {
            handleDeleteClick();
        }
    };

    const handleNumberClick = (keyValue) => {
        setCurrentValue((prevValue) => {
            let newValue = prevValue.toString() + keyValue;
            newValue = (keyValue != 0) ? parseFloat(newValue) : newValue;
            newValue = (keyValue == 0 && prevValue == 0) ? 0 : newValue;
            setValue(newValue);
            return newValue;
        });
    };

    const handleOperatorClick = (keyValue) => {
        setCurrentOperator(keyValue);

        let newTotal = currentValue;

        if (total > 0) {
            switch (currentOperator) {
                case "+":
                    newTotal += currentValue;
                    break;
                case "-":
                    newTotal -= currentValue;
                    break;
                case "*":
                    newTotal *= currentValue;
                    break;
                case "/":
                    newTotal /= currentValue;
                    break;
                default:
                    break;
            }
        }

        setTotal(newTotal);
        setCurrentValue(0);
    };

    const handleEqualClick = () => {
        let newTotal = total;

        switch (currentOperator) {
            case "+":
                newTotal += currentValue;
                break;
            case "-":
                newTotal -= currentValue;
                break;
            case "*":
                newTotal *= currentValue;
                break;
            case "/":
                newTotal /= currentValue;
                break;
            default:
                break;
        }

        setTotal(newTotal);
        setValue(newTotal);
        setCurrentValue(newTotal);
        setCurrentOperator(null);
    };

    const handleCommaClick = () => {
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
        setCurrentOperator(null);
    };

    return (
        <div
            className="flex flex-row h-full bg-black text-center text-4xl text-gray-400"
            onClick={handleClick}
        >
            <div className="grow grid grid-cols-3 bg-gray-900">
                <div
                    data-key-type="number"
                    data-key="7"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="7" className="m-auto">
                        7
                    </div>
                </div>
                <div
                    data-key-type="number"
                    data-key="8"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="8"  className="m-auto">8</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="9"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="9" className="m-auto">9</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="4"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="4" className="m-auto">4</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="5"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="5" className="m-auto">5</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="6"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="6" className="m-auto">6</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="1"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="1" className="m-auto">1</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="2"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="2" className="m-auto">2</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="3"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="3" className="m-auto">3</div>
                </div>
                <div data-key-type="comma" data-key="." className="flex h-full">
                    <div data-key-type="comma" data-key="." className="m-auto">.</div>
                </div>
                <div
                    data-key-type="number"
                    data-key="0"
                    className="flex h-full"
                >
                    <div data-key-type="number" data-key="0" className="m-auto">0</div>
                </div>
                <div
                    data-key-type="delete"
                    data-key="del"
                    className="flex h-full"
                >
                    <div data-key-type="delete" data-key="del" className="m-auto">Del</div>
                </div>
            </div>
            {/* <div className="basis-1/4 grid grid-cols-1 text-2xl">
                <div
                    data-key-type="operator"
                    data-key="/"
                    className="self-center"
                >
                    /
                </div>
                <div
                    data-key-type="operator"
                    data-key="*"
                    className="self-center"
                >
                    *
                </div>
                <div
                    data-key-type="operator"
                    data-key="-"
                    className="self-center"
                >
                    -
                </div>
                <div
                    data-key-type="operator"
                    data-key="+"
                    className="self-center"
                >
                    +
                </div>
                <div data-key-type="equal" data-key="=" className="self-center">
                    =
                </div>
            </div> */}
        </div>
    );
}
