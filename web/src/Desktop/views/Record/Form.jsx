import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";

import Api from "../../../Api/Endpoints";
import CategoryPicker from "./Components/CategoryPicker";
import Layout from "../../layout/Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Form() {
    const [accounts, setAccounts] = useState([]);
    const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
    const [category, setCategory] = useState({ id: 0, name: "" });
    const [record, setRecord] = useState(null);

    const { record_id } = useParams();

    useEffect(() => {
        async function getData() {
            const accounts = await Api.getAccounts();
            setAccounts(accounts);
            if (record_id !== undefined) {
                const record = await Api.getRecordById(record_id);
                setRecord(record);
                setCategory({
                    id: record.category_id,
                    name: record.category_name,
                });
            }
        }
        getData();
    }, []);

    const handleOpenCategory = () => {
        setCategoryPickerOpen(true);
    };

    const handleInputChange = (event) => {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        setRecord({ ...record, [name]: value });
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(document.querySelector("form"));
        const formObject = Object.fromEntries(formData.entries());
        await Api.createRecord(formObject, record_id);
        window.location.href = "/";
    };

    const handleDeleteRecord = async () => {
        if (confirm("Delete this record?") === true) {
            await Api.deleteRecord(record_id);
            window.location.href = "/";
        }
    };

    return (
        <Layout className="">
            {categoryPickerOpen && (
                <CategoryPicker
                    setOpen={setCategoryPickerOpen}
                    setCategory={setCategory}
                />
            )}
            <form onSubmit={handleSaveForm}>
                <div className="flex px-10 mt-14">
                    <div className="bg-gray-700 rounded-3xl p-5">
                        <div className="flex flex-col gap-y-5">
                            <ul className="grid w-full gap-6 md:grid-cols-3">
                                <li>
                                    <input
                                        type="radio"
                                        id="income"
                                        name="type"
                                        value="income"
                                        className="hidden peer"
                                        onChange={handleInputChange}
                                        defaultChecked={
                                            record && record.type === "income"
                                        }
                                        required
                                    ></input>
                                    <label
                                        for="income"
                                        className="inline-flex items-center justify-center w-full p-5 text-gray-400 bg-gray-800 border border-gray-200 rounded-lg cursor-pointer hover:text-gray-300 border-gray-700 peer-checked:text-green-400 peer-checked:border-green-400 peer-checked:text-green-400 hover:text-gray-600 hover:bg-gray-100 hover:bg-gray-700"
                                    >
                                        <div className="block">
                                            <div className="w-full text-lg font-semibold">
                                                Income
                                            </div>
                                        </div>
                                    </label>
                                </li>
                                <li>
                                    <input
                                        type="radio"
                                        id="expense"
                                        name="type"
                                        value="expense"
                                        className="hidden peer"
                                        onChange={handleInputChange}
                                        defaultChecked={
                                            record && record.type === "expense"
                                        }
                                        required
                                    ></input>
                                    <label
                                        for="expense"
                                        className="inline-flex items-center justify-center w-full p-5 text-gray-400 bg-gray-800 border border-gray-200 rounded-lg cursor-pointer hover:text-gray-300 border-gray-700 peer-checked:text-green-400 peer-checked:border-green-400 peer-checked:text-green-400 hover:text-gray-600 hover:bg-gray-100 hover:bg-gray-700"
                                    >
                                        <div className="block">
                                            <div className="w-full text-lg font-semibold">
                                                Expense
                                            </div>
                                        </div>
                                    </label>
                                </li>
                                <li>
                                    <input
                                        type="radio"
                                        id="transfer"
                                        name="type"
                                        value="transfer"
                                        className="hidden peer"
                                        onChange={handleInputChange}
                                        defaultChecked={
                                            record && record.type === "transfer"
                                        }
                                        required
                                    ></input>
                                    <label
                                        for="transfer"
                                        className="inline-flex items-center justify-center w-full p-5 text-gray-400 bg-gray-800 border border-gray-200 rounded-lg cursor-pointer hover:text-gray-300 border-gray-700 peer-checked:text-green-400 peer-checked:border-green-400 peer-checked:text-green-400 hover:text-gray-600 hover:bg-gray-100 hover:bg-gray-700"
                                    >
                                        <div className="block">
                                            <div className="w-full text-lg font-semibold">
                                                Transfer
                                            </div>
                                        </div>
                                    </label>
                                </li>
                            </ul>

                            <div>
                                <label
                                    for="from_account_id"
                                    className="block mb-2 text-sm font-medium text-gray-900 text-white"
                                >
                                    Account
                                </label>
                                <select
                                    name="from_account_id"
                                    id="from_account_id"
                                    onChange={handleInputChange}
                                    className="basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select account...</option>
                                    {accounts.map((account) => (
                                        <option
                                            key={account.id}
                                            value={account.id}
                                            selected={
                                                account.id ===
                                                record?.from_account_id
                                            }
                                        >
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                {record?.type === "transfer" ? (
                                    <>
                                        <label
                                            for="to_account_id"
                                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                                        >
                                            To account
                                        </label>
                                        <select
                                            name="to_account_id"
                                            id="to_account_id"
                                            className="basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">
                                                Select account...
                                            </option>
                                            {accounts.map((account) => (
                                                <option
                                                    key={account.id}
                                                    value={account.id}
                                                    selected={
                                                        account.id ===
                                                        record?.to_account_id
                                                    }
                                                >
                                                    {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                ) : (
                                    <div
                                        className="basis-4/12 block w-full p-4 cursor-pointer border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                        onClick={handleOpenCategory}
                                    >
                                        <label
                                            for="date"
                                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                                        >
                                            Category
                                        </label>
                                        <div>{category.name}</div>
                                        <input
                                            type="hidden"
                                            onChange={handleInputChange}
                                            name="category_id"
                                            value={category.id}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    for="date"
                                    className="block mb-2 text-sm font-medium text-gray-900 text-white"
                                >
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    className="basis-4/12 block w-full p-4 cursor-pointer border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                    onChange={handleInputChange}
                                    defaultValue={record?.date}
                                    value={
                                        record?.date
                                            ? moment(record?.date).format(
                                                  "YYYY-MM-DD"
                                              )
                                            : moment(new Date()).format(
                                                  "YYYY-MM-DD"
                                              )
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    for="name"
                                    className="block mb-2 text-sm font-medium text-gray-900 text-white"
                                >
                                    Description
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    onChange={handleInputChange}
                                    defaultValue={record?.name}
                                    className="basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                ></input>
                            </div>

                            <div>
                                <label
                                    for="amount"
                                    className="block mb-2 text-sm font-medium text-gray-900 text-white"
                                >
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="amount"
                                    id="amount"
                                    onChange={handleInputChange}
                                    defaultValue={record?.amount}
                                    className="basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                ></input>
                            </div>

                            <div className="flex flex-row gap-x-3">
                                <button
                                    type="submit"
                                    className="grow flex flex-row px-5 text-xl font-bold py-3 gap-x-5 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 rounded-full justify-center cursor-pointer items-center transition"
                                >
                                    <FontAwesomeIcon icon="fa-solid fa-check" />
                                    Save
                                </button>
                                {record && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteRecord}
                                        className="basis-1/12 flex flex-row px-5 text-xl font-bold py-3 gap-x-5 bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 focus:ring-red-800 shadow-lg shadow-red-500/50 shadow-lg shadow-red-800/80 rounded-xl justify-center cursor-pointer items-center transition"
                                    >
                                        <FontAwesomeIcon icon="fa-solid fa-trash" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Layout>
    );
}
