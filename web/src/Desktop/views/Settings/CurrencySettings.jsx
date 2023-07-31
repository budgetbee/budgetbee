import React, { useEffect, useState } from "react";
import Api from "../../../Api/Endpoints";
import SettingsLayout from "../../layout/SettingsLayout";
import CurrencyCard from "./Components/CurrencyCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function CurrencySettings() {
    const [userSettings, setUserSettings] = useState([]);
    const [userCurrencies, setUserCurrencies] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [createNewForm, setCreateNewForm] = useState(false);

    useEffect(() => {
        async function getData() {
            const userSettings = await Api.getUserSettings();
            const userCurrencies = await Api.getUserCurrencies();
            const currencies = await Api.getCurrencies();
            setUserSettings(userSettings);
            setUserCurrencies(userCurrencies);
            setCurrencies(currencies);
        }
        getData();
    }, []);

    const handleInputChange = (event) => {
        const field = event.target.name;
        const value = event.target.value;
        const data = { [field]: value };
        setUserSettings((prevData) => ({ ...prevData, ...data }));
    };

    const handleSaveSettings = async () => {
        Api.updateUserSettings(userSettings);
    };

    const handleCreateNewCurrency = async (e) => {
        e.preventDefault();
        const formData = new FormData(document.querySelector("form"));
        const formObject = Object.fromEntries(formData.entries());
        await Api.createUserCurrency(formObject);
        const userCurrencies = await Api.getUserCurrencies();
        const currencies = await Api.getCurrencies();
        setUserCurrencies(userCurrencies);
        setCurrencies(currencies);
        setCreateNewForm(false);
    };

    return (
        <SettingsLayout>
            <div className="flex flex-col gap-y-10">
                <div className="w-full top-0 basis-1/12 flex flex-row justify-between items-center h-14">
                    <div>
                        <button
                            onClick={handleSaveSettings}
                            className="flex flex-row px-5 py-3 gap-x-5  bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 rounded-full justify-between cursor-pointer items-center transition"
                        >
                            <FontAwesomeIcon
                                icon="fa-solid fa-check"
                                className={"text-white text-xl"}
                            />
                            <span>save</span>
                        </button>
                    </div>
                </div>
                <div className="w-full flex flex-col gap-y-10">
                    <div className="w-fit">
                        <label
                            htmlFor="name"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Base currency
                        </label>
                        <select
                            name="currency_id"
                            id="currency_id"
                            required={true}
                            onChange={handleInputChange}
                            className="block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            {userCurrencies.map((currency, index) => {
                                return (
                                    <option
                                        key={index}
                                        value={currency.currency_id}
                                        selected={
                                            currency.currency_id ===
                                            userSettings?.currency.id
                                        }
                                    >
                                        {currency.currency_name}{" "}
                                        {currency.currency_symbol} (
                                        {currency.currency_code})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className="flex flex-col gap-y-3 mt-10">
                        <div>
                            {createNewForm ? (
                                <form onSubmit={handleCreateNewCurrency}>
                                    <div className="flex flex-row gap-x-5 items-center">
                                        <select
                                            name="currency_id"
                                            id="currency_id"
                                            required={true}
                                            className="block w-fit p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {currencies.map(
                                                (currency, index) => {
                                                    return (
                                                        <option
                                                            key={index}
                                                            value={currency.id}
                                                        >
                                                            {currency.name}{" "}
                                                            {currency.symbol} (
                                                            {currency.code})
                                                        </option>
                                                    );
                                                }
                                            )}
                                        </select>
                                        <input
                                            type="number"
                                            name="exchange_rate_to_default_currency"
                                            id="exchange_rate_to_default_currency"
                                            step="any"
                                            required={true}
                                            className="block w-fit p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <div className="text-lg text-gray-400">
                                            = {userSettings.currency.symbol}{" "}
                                            1.00 {userSettings.currency.code}
                                        </div>
                                        <div className="pl-5">
                                            <button type="submit">
                                                <FontAwesomeIcon
                                                    icon="fa-solid fa-check"
                                                    className="text-2xl text-green-400"
                                                />
                                            </button>
                                        </div>
                                        <div className="pl-5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCreateNewForm(false)
                                                }
                                            >
                                                <FontAwesomeIcon
                                                    icon="fa-solid fa-xmark"
                                                    className="text-2xl text-gray-400"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setCreateNewForm(true)}
                                    className="flex flex-row px-5 py-3 gap-x-5 bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-indigo-300 focus:ring-indigo-800 shadow-lg shadow-indigo-500/50 shadow-lg shadow-indigo-800/80 rounded-full justify-between cursor-pointer items-center transition"
                                >
                                    <FontAwesomeIcon
                                        icon="fa-solid fa-plus"
                                        className={"text-white text-xl"}
                                    />
                                    <span>Add new currency</span>
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {userCurrencies.map((currency) => {
                                return (
                                    <CurrencyCard
                                        currency={currency}
                                        userSettings={userSettings}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}
