import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Layout from "../../layout/Layout";
import Api from "../../../Api/Endpoints";

export default function View() {
    const [accounts, setAccounts] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [newAccount, setNewAccount] = useState(null);
    const [accountToEdit, setAccountToEdit] = useState(null);

    useEffect(() => {
        async function getData() {
            const data = await Api.getAccounts();
            const types = await Api.getAccountTypes();
            setAccounts(data);
            setAccountTypes(types);
        }
        getData();
    }, []);

    const handleEditAccount = (event) => {
        const field = event.target.name;
        const value = event.target.value;
        const data = { [field]: value };
        setAccountToEdit((prevData) => ({ ...prevData, ...data }));
    };

    const handleSaveAccountToEdit = async () => {
        await Api.createOrUpdateAccount(accountToEdit, accountToEdit.id);
        const data = await Api.getAccounts();
        setAccounts(data);
        setAccountToEdit(null);
    };

    const handleNewAccountChange = (event) => {
        const field = event.target.name;
        const value = event.target.value;
        const data = { [field]: value };
        setNewAccount((prevData) => ({ ...prevData, ...data }));
    };

    const handleSaveNewAccount = async () => {
        await Api.createOrUpdateAccount(newAccount);
        const data = await Api.getAccounts();
        setAccounts(data);
        setNewAccount(null);
    };

    const createNewForm = (
        <div className="flex flex-row gap-x-5 items-center">
            <input
                type="color"
                name="color"
                id="color"
                onChange={handleNewAccountChange}
                className="appearance-none w-12 h-12"
            ></input>
            <input
                type="text"
                name="name"
                id="name"
                onChange={handleNewAccountChange}
                className="basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
            />
            <select
                name="type_id"
                id="type_id"
                onChange={handleNewAccountChange}
                className="basis-2/12 block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
            >
                {accountTypes.map((type, index) => {
                    return (
                        <option key={index} value={type.id}>
                            {type.name}
                        </option>
                    );
                })}
            </select>
            <input
                type="number"
                step="any"
                name="initial_balance"
                id="initial_balance"
                onChange={handleNewAccountChange}
                className="basis-2/12 block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
            />
            <div className="flex flex-row gap-x-10">
                <button type="button" onClick={() => handleSaveNewAccount()}>
                    <FontAwesomeIcon
                        icon="fa-solid fa-check"
                        className="text-2xl text-green-400"
                    />
                </button>
                <button type="button" onClick={() => setNewAccount(null)}>
                    <FontAwesomeIcon
                        icon="fa-solid fa-xmark"
                        className="text-2xl text-gray-400"
                    />
                </button>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="flex flex-col gap-y-10 bg-gray-800 top-0 left-0 w-full px-10 mt-14">
                <div className="">
                    <div>
                        <button
                            type="submit"
                            onClick={() => setNewAccount({})}
                            className="flex flex-row px-5 py-3 gap-x-5 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 rounded-full justify-between cursor-pointer items-center transition"
                        >
                            Create new
                        </button>
                    </div>
                </div>
                {newAccount && createNewForm}
                <div className="flex flex-col divide-y divide-gray-600/50 rounded-3xl bg-gray-700 p-5 grow">
                    <div className="flex flex-row justify-between items-center text-white font-bold px-4 py-4">
                        <div className="basis-5/12">Name</div>
                        <div className="basis-2/12">Account type</div>
                        <div className="basis-2/12 text-right">
                            Initial balance
                        </div>
                        <div className="basis-2/12 text-right">
                            Current balance
                        </div>
                        <div className="basis-1/12 text-right">Actions</div>
                    </div>
                    {accounts.map((account, index) => {
                        const inline_style = {
                            backgroundColor: account.color,
                        };
                        return (
                            <div key={index}>
                                <div className="flex flex-row justify-between items-center text-white px-4 py-4">
                                    <div className="flex flex-row gap-x-4 items-center basis-5/12">
                                        <div
                                            className="w-9 h-9 rounded-full bg-gray-500"
                                            style={inline_style}
                                        ></div>
                                        <div className="flex flex-col">
                                            <div className="font-bold">
                                                {accountToEdit?.id ===
                                                account.id ? (
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        id="name"
                                                        defaultValue={
                                                            account.name
                                                        }
                                                        onChange={
                                                            handleEditAccount
                                                        }
                                                        className="block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <span>{account.name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="basis-2/12">
                                        {accountToEdit?.id === account.id ? (
                                            <select
                                                name="type_id"
                                                id="type_id"
                                                onChange={handleEditAccount}
                                                defaultValue={account.type_id}
                                                className="block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {accountTypes.map(
                                                    (type, index) => {
                                                        return (
                                                            <option
                                                                key={index}
                                                                value={type.id}
                                                            >
                                                                {type.name}
                                                            </option>
                                                        );
                                                    }
                                                )}
                                            </select>
                                        ) : (
                                            <span>{account.type_name}</span>
                                        )}
                                    </div>
                                    <div className="basis-2/12 text-right">
                                        {accountToEdit?.id === account.id ? (
                                            <input
                                                type="number"
                                                step="any"
                                                name="initial_balance"
                                                id="initial_balance"
                                                onChange={handleEditAccount}
                                                defaultValue={
                                                    account.initial_balance
                                                }
                                                className="block float-right p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <span>
                                                {numeral(
                                                    account.initial_balance
                                                ).format("$0,0.00")}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col font-bold text-right basis-2/12">
                                        <div
                                            className="text-green-400"
                                            style={{
                                                color:
                                                    account.balance < 0
                                                        ? "red"
                                                        : "",
                                            }}
                                        >
                                            {numeral(account.balance).format(
                                                "$0,0.00"
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-row justify-end gap-x-5 basis-1/12 text-right">
                                        {accountToEdit?.id === account.id && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSaveAccountToEdit()
                                                    }
                                                >
                                                    <FontAwesomeIcon
                                                        icon="fa-solid fa-check"
                                                        className="text-2xl text-green-400"
                                                    />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAccountToEdit(null)
                                                    }
                                                >
                                                    <FontAwesomeIcon
                                                        icon="fa-solid fa-xmark"
                                                        className="text-2xl text-gray-400"
                                                    />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAccountToEdit(account)
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon="fa-solid fa-pen-to-square"
                                                className="text-2xl text-gray-400"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
