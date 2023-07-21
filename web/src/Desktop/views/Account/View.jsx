import React, { useEffect, useState } from "react";
import numeral from "numeral";

import Layout from "../../layout/Layout";
import Api from "../../../Api/Endpoints";

export default function View() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [account, setAccount] = useState(null);
    const [accountTypes, setAccountTypes] = useState([]);

    useEffect(() => {
        async function getData() {
            const data = await Api.getAccounts();
            const types = await Api.getAccountTypes();
            setData(data);
            setAccountTypes(types);
            setIsLoading(false);
        }
        getData();
    }, []);

    const handleSelectAccount = async (account_id) => {
        const account = await Api.getAccountById(account_id);
        setAccount(account);
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        await Api.createOrUpdateAccount(formObject, account?.id);
        const data = await Api.getAccounts();
        setData(data);
    };

    let accountList = "";
    if (!isLoading) {
        accountList = data.map((account, index) => {
            const inline_style = {
                backgroundColor: account.color,
            };
            return (
                <div key={index}>
                    <div
                        className="flex flex-row justify-between items-center cursor-pointer text-white px-4 py-4"
                        onClick={() => handleSelectAccount(account.id)}
                    >
                        <div className="flex flex-row gap-x-4 items-center">
                            <div
                                className="w-9 h-9 rounded-full bg-gray-500"
                                style={inline_style}
                            ></div>
                            <div className="flex flex-col">
                                <div className="font-bold">{account.name}</div>
                                <div className="text-white/40">
                                    <strong>{account.type_name}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col font-bold text-right">
                            <div
                                className="text-green-400"
                                style={{
                                    color: account.balance < 0 ? "red" : "",
                                }}
                            >
                                {numeral(account.balance).format("$0,0.00")}
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    }

    console.log(account);

    return (
        <Layout>
            <div className="flex flex-row gap-x-10 bg-gray-800 top-0 left-0 w-full px-10 mt-14">
                <div className="flex flex-col divide-y divide-gray-600/50 rounded-3xl bg-gray-700 p-10 basis-3/12">
                    <div>
                        <button
                            type="button"
                            onClick={() => setAccount(null)}
                            class="w-full py-3 text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 font-medium rounded-lg text-xl px-5 text-center"
                        >
                            Create
                        </button>
                    </div>
                    {accountList}
                </div>
                <div className="basis-4/12">
                    <form onSubmit={handleSaveForm}>
                        <div className="flex flex-col gap-y-4 px-5">
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
                                    className="border text-lg rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    value={account?.name ?? ""}
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
                                    className="border text-lg rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {accountTypes.map((acc, index) => {
                                        return (
                                            <option
                                                key={index}
                                                className=""
                                                value={acc.id}
                                                selected={
                                                    account &&
                                                    account.type_id === acc.id
                                                }
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
                                    Initial balance
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="initial_balance"
                                    required="required"
                                    id="initial_balance"
                                    className="border text-lg rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    value={account?.initial_balance ?? 0}
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
                                    className="block w-full rounded-lg h-12"
                                    value={account && account.color}
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    class="w-full py-3 text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 font-medium rounded-lg text-xl px-5 text-center"
                                >
                                    {account ? "Modify" : "Save"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
