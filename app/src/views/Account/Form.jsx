import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Api from "../../Api/Endpoints";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function Form() {
    const [isLoading, setIsLoading] = useState(true);
    const [account, setAccount] = useState(null);
    const [accountTypes, setAccountTypes] = useState(null);
    const [stocks, setStocks] = useState([]);

    const { account_id } = useParams();

    useEffect(() => {
        async function getData() {
            const types = await Api.getAccountTypes();
            setAccountTypes(types);
            if (account_id !== undefined) {
                const account = await Api.getAccountById(account_id);
                const stocks = await Api.getAccountStocks(account_id);
                setAccount(account);
                setStocks(stocks);
            }
            setIsLoading(false);
        }
        getData();
    }, []);

    const handleClick = () => {
        const newStock = {
            id: Date.now() + '_new', // Genera un identificador único utilizando la marca de tiempo actual
            stock_ticker_: "",
            stock_total_: "",
        };

        setStocks([...stocks, newStock]);
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        await Api.createOrUpdateAccount(formObject, account_id);
        window.location = "/accounts";
    };

    if (isLoading) {
        return <></>;
    }

    return (
        <div className="min-h-screen bg-gray-800">
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
                            Nombre
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={account && account.name}
                        ></input>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="type_id"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Tipo de cuenta
                        </label>
                        <select
                            name="type_id"
                            id="type_id"
                            className="block w-full px-4 py-4 text-base text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={account && account.type_id}
                        >
                            {accountTypes.map((acc, index) => {
                                return (
                                    <option
                                        key={index}
                                        className="text-black"
                                        value={acc.id}
                                    >
                                        {acc.name}
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
                            Balance inicial
                        </label>
                        <input
                            type="number"
                            step="any"
                            name="initial_balance"
                            id="initial_balance"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={account && account.initial_balance}
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
                            className="block w-full h-12"
                            defaultValue={account && account.color}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <div className="text-white text-2xl">Acciones</div>
                        <div id="stock_list" className="flex flex-col gap-y-4">
                            {stocks.map((stock) => (
                                <div
                                    key={stock.id}
                                    id={`stock_${stock.id}`}
                                    className="flex flex-row justify-between gap-x-4"
                                >
                                    <input
                                        type="text"
                                        name={`stock_ticker_${stock.id}`}
                                        id={`stock_ticker_${stock.id}`}
                                        defaultValue={stock.ticker}
                                        className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        name={`stock_total_${stock.id}`}
                                        id={`stock_total_${stock.id}`}
                                        defaultValue={stock.total}
                                        className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            ))}
                        </div>
                        <div>
                            <button
                                type="button"
                                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xl px-5 py-5 text-center mr-2 mb-2"
                                onClick={handleClick}
                            >
                                Añadir
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
