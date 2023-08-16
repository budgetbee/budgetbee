import React, { useEffect, useState } from "react";
import Api from "../../../Api/Endpoints";
import SettingsLayout from "../../layout/SettingsLayout";
import CurrencyCard from "./Components/CurrencyCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@nextui-org/react";

export default function CurrencySettings() {
    const [userSettings, setUserSettings] = useState([]);
    const [userCurrencies, setUserCurrencies] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createNewForm, setCreateNewForm] = useState(false);

    async function getData() {
        try {
            const userSettings = await Api.getUserSettings();
            const userCurrencies = await Api.getUserCurrencies();
            const currencies = await Api.getAllCurrencies();
            setUserSettings(userSettings);
            setUserCurrencies(userCurrencies);
            setCurrencies(currencies);
        } catch (error) {
            // console.error("Error updating user settings:", error);
        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        getData();
    }, []);

    const handleInputChange = (event) => {
        const field = event.target.name;
        const value = event.target.value;
        const data = { [field]: value };
        setUserSettings((prevData) => ({ ...prevData, ...data }));
    };

    const handleSaveSettings = async () => {
        try {
            setIsLoading(true);
            await Api.updateUserSettings(userSettings);
        } catch (error) {
            // console.error("Error updating user settings:", error);
        } finally {
            getData();
        }
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
                        <Button
                            color="success"
                            onClick={handleSaveSettings}
                            isLoading={isLoading}
                            startContent={
                                !isLoading && (
                                    <FontAwesomeIcon icon="fa-solid fa-check" />
                                )
                            }
                        >
                            Success
                        </Button>
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
                            className="block w-full p-4 border border-gray-700 rounded-lg bg-background sm:text-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            {userCurrencies.map((currency, index) => {
                                return (
                                    <option
                                        key={index}
                                        value={currency.id}
                                        selected={
                                            currency.id ===
                                            userSettings?.currency.id
                                        }
                                    >
                                        {currency.name} {currency.symbol} (
                                        {currency.code})
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
                                            className="block w-fit p-4 border border-gray-700 rounded-lg bg-background sm:text-md focus:ring-blue-500 focus:border-blue-500"
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
                                            className="block w-fit p-4 border border-gray-700 rounded-lg bg-background sm:text-md focus:ring-blue-500 focus:border-blue-500"
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
                                <Button
                                    color="primary"
                                    onClick={() => setCreateNewForm(true)}
                                    startContent={
                                        <FontAwesomeIcon icon="fa-solid fa-plus" />
                                    }
                                >
                                    Add new currency
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {userCurrencies
                                .filter(
                                    (currency) =>
                                        currency.id !== userSettings.currency.id
                                )
                                .map((currency) => (
                                    <CurrencyCard
                                        key={currency.id}
                                        currency={currency}
                                        userSettings={userSettings}
                                    />
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}
