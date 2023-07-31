import React, { useState } from "react";
import numeral from "numeral";
import Api from "../../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function CurrencySettings({ currency, userSettings }) {
    const [editCurrency, setEditCurrency] = useState(false);
    const [currencyValue, setCurrencyValue] = useState(currency.exchange_rate_to_default_currency);

    const handleSave = async () => {
        Api.updateUserCurrency({exchange_rate_to_default_currency: currencyValue}, currency.id);
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
                <span>{currency.currency_name}</span>
                <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
                <span>{userSettings.currency.name}</span>
            </h5>
            <div>
                {currency.currency_symbol !== currency.currency_code &&
                    currency.currency_symbol}
                {currency.exchange_rate_to_default_currency}{" "}
                {currency.currency_code} = {userSettings.currency.symbol}{" "}
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
                            className="basis-6/12 block w-full p-4 border-none rounded-lg bg-gray-800 text-xl text-white"
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
                    <button
                        type="button"
                        onClick={() => setEditCurrency(true)}
                        className="px-10 py-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-lg text-center"
                    >
                        Edit
                    </button>
                )}
            </div>
            {editCurrency && (
                <div className="flex flex-row gap-x-5">
                    <div className="basis-6/12">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="w-full"
                        >
                            <FontAwesomeIcon
                                icon="fa-solid fa-check"
                                className="w-full py-4 text-white bg-green-400 hover:bg-green-900 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-lg text-center"
                            />
                        </button>
                    </div>
                    <div className="basis-6/12">
                        <button
                            type="button"
                            onClick={() => setEditCurrency(false)}
                            className="w-full"
                        >
                            <FontAwesomeIcon
                                icon="fa-solid fa-xmark"
                                className="w-full py-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-lg text-center"
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
