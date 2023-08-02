import React, { useState } from "react";
import numeral from "numeral";
import Api from "../../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@nextui-org/react";

export default function CurrencySettings({ currency, userSettings }) {
    const [editCurrency, setEditCurrency] = useState(false);
    const [currencyValue, setCurrencyValue] = useState(
        currency.exchange_rate_to_default_currency
    );

    const handleSave = async () => {
        Api.updateUserCurrency(
            { exchange_rate_to_default_currency: currencyValue },
            currency.id
        );
        setEditCurrency(false);
        currency.exchange_rate_to_default_currency = currencyValue;
    };

    const handleInputChange = (event) => {
        const value = event.target.value;
        setCurrencyValue(value);
    };

    return (
        <div
            key={currency.id}
            className="flex flex-col gap-y-5 block max-w-sm p-6 border rounded-lg shadow hover:bg-gray-100 bg-gray-700 border-gray-700 hover:bg-gray-600 transition"
        >
            <h5 className="flex flex-row gap-x-2 items-center mb-2 text-2xl font-bold tracking-tight text-white">
                <span>{currency.name}</span>
                <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
                <span>{userSettings.currency.name}</span>
            </h5>
            <div>
                {currency.symbol !== currency.code &&
                    currency.symbol}{" "}
                {currency.exchange_rate_to_default_currency}{" "}
                {currency.code} = {userSettings.currency.symbol}{" "}
                {numeral(1).format("0,0.00")} {userSettings.currency.code}
            </div>
            <div>
                {editCurrency ? (
                    <div className="flex flex-row gap-x-5 items-center font-normal text-gray-400">
                        <input
                            type="number"
                            name={`exchange_rate_to_default_currency[${currency.id}]`}
                            id={`exchange_rate_to_default_currency[${currency.id}]`}
                            step="any"
                            required={true}
                            className="basis-6/12 block w-full p-4 border-none rounded-lg bg-background text-xl text-white"
                            onChange={handleInputChange}
                            defaultValue={
                                currency.exchange_rate_to_default_currency
                            }
                        />
                        <div className="basis-6/12">
                            ={" "}
                            {userSettings.currency.symbol !==
                                userSettings.currency.code &&
                                userSettings.currency.symbol}{" "}
                            {numeral(1).format("0,0.00")}{" "}
                            {userSettings.currency.code}
                        </div>
                    </div>
                ) : (
                    <Button
                        color="default"
                        variant="ghost"
                        className="text-white"
                        onClick={() => setEditCurrency(true)}
                    >
                        Edit
                    </Button>
                )}
            </div>
            {editCurrency && (
                <div className="flex flex-row gap-x-5">
                    <div className="basis-6/12">
                        <Button
                            color="success"
                            onClick={handleSave}
                            className="w-full text-white"
                            startContent={
                                <FontAwesomeIcon icon="fa-solid fa-check" className="text-2xl" />
                            }
                        >
                        </Button>
                    </div>
                    <div className="basis-6/12">
                        <Button
                            color="default"
                            onClick={() => setEditCurrency(false)}
                            className="w-full text-white"
                            startContent={
                                <FontAwesomeIcon icon="fa-solid fa-xmark" className="text-2xl" />
                            }
                        >
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
