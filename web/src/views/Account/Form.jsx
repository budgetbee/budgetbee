import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Api from "../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function Form() {
    const [account, setAccount] = useState(null);
    const [accountTypes, setAccountTypes] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [colorValue, setColorValue] = useState("");

    const { account_id } = useParams();

    useEffect(() => {
        async function getData() {
            const types = await Api.getAccountTypes();
            const currencies = await Api.getCurrencies();
            setAccountTypes(types);
            setCurrencies(currencies);
            if (account_id !== undefined) {
                const account = await Api.getAccountById(account_id);
                setAccount(account);
                setColorValue(account.color);
            }
        }
        getData();
    }, [account_id]);

    const handleColorChange = (e) => {
        setColorValue(e.target.value);
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        await Api.createOrUpdateAccount(formObject, account_id);
        window.location = "/accounts";
    };

    return (
        <div className="min-h-screen bg-background">
            <form onSubmit={handleSaveForm}>
                <div className="fixed w-full top-0 basis-1/12 flex flex-row justify-between items-center bg-gray-700 mb-5 h-14">
                    <div
                        onClick={() => window.history.back()}
                        className="py-3 pl-5 pr-10 cursor-pointer"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className={"text-white text-2xl"}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="py-3 pl-10 pr-5 cursor-pointer"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className={"text-white text-2xl"}
                            />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-y-4 px-5 mt-14 pt-4">
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Account name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required="required"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={account && account.name}
                        ></input>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="type_id"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Account type
                        </label>
                        <select
                            name="type_id"
                            id="type_id"
                            required="required"
                            className="block w-full px-4 py-4 text-base text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {accountTypes.map((acc, index) => {
                                return (
                                    <option
                                        key={index}
                                        className="text-black"
                                        value={acc.id}
                                        selected={acc.id === account?.type_id}
                                    >
                                        {acc.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="currency_id"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Currency
                        </label>
                        <select
                            name="currency_id"
                            id="currency_id"
                            required="required"
                            className="block w-full px-4 py-4 text-base text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {currencies.map((currency, index) => {
                                return (
                                    <option
                                        key={index}
                                        className="text-black"
                                        value={currency.id}
                                        selected={
                                            currency.id === account?.currency_id
                                        }
                                    >
                                        {currency.name} {currency.symbol} (
                                        {currency.code})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="initial_balance"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Initial balance
                        </label>
                        <input
                            type="number"
                            step="any"
                            name="initial_balance"
                            required="required"
                            id="initial_balance"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={account?.initial_balance}
                        ></input>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="color"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Color
                        </label>
                        <input
                            type="color"
                            name="color"
                            id="color"
                            required="required"
                            className="block w-full h-12"
                            value={colorValue}
                            onChange={handleColorChange}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}
