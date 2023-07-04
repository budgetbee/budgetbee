import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";

import Api from "../../Api/Endpoints";
import Calculator from "./Components/Calculator";
import CategoryPicker from "./Components/CategoryPicker";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function Form() {
    const [isLoading, setIsLoading] = useState(true);
    const [record, setRecord] = useState(null);
    const [amount, setAmount] = useState(0);
    const [type, setType] = useState("expense");
    const [account, setAccount] = useState(null);
    const [toAccount, setToAccount] = useState(null);
    const [date, setDate] = useState(null);
    const [name, setName] = useState(null);
    const [accounts, setAccounts] = useState(null);
    const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
    const [category, setCategory] = useState({ id: 0, name: "" });
    const [formValues, setFormValues] = useState({});

    const { record_id } = useParams();

    useEffect(() => {
        async function getData() {
            const accounts = await Api.getAccounts();
            setAccounts(accounts);
            if (record_id !== undefined) {
                const record = await Api.getRecordById(record_id);
                setRecord(record);
                setType(record.type);
                setCategory({
                    id: record.category_id,
                    name: record.category_name,
                });
                setAmount(Math.abs(record.amount));
                setAccount(record.from_account_id);
                setToAccount(record.to_account_id);
                setDate(record.date);
                setName(record.name);
            }
            setIsLoading(false);
        }
        getData();
    }, []);

    const handleRecordType = (event) => {
        const target = event.target;
        const type = target.getAttribute("data-type");
        setType(type);
    };

    const handleOpenCategory = () => {
        setCategoryPickerOpen(true);
    };

    const handleInputName = (event) => {
        setName(event.target.value);
    };

    const handleInputDate = (event) => {
        setDate(event.target.value);
    };

    const handleGoToDashboard = () => {
        window.history.back();
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        setFormValues(formObject);
        await Api.createRecord(formObject, record_id);
        window.history.back();
    };

    if (isLoading) {
        return <></>;
    }

    return (
        <div className="">
            {categoryPickerOpen && (
                <CategoryPicker
                    setOpen={setCategoryPickerOpen}
                    setCategory={setCategory}
                />
            )}
            <form onSubmit={handleSaveForm}>
                <div className="flex flex-col h-screen max-w-full">
                    <div
                        className={`basis-6/12 flex flex-col text-white ${
                            type === "income"
                                ? "bg-[#4a883b]"
                                : type === "expense"
                                ? "bg-[#ab3a3a]"
                                : "bg-[#3f45a3]"
                        }`}
                    >
                        <div className="basis-1/12 flex flex-row justify-between items-center bg-gray-700">
                            <div
                                onClick={handleGoToDashboard}
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
                        <div
                            className="basis-2/12 flex flex-row items-center text-center font-bold divide-x cursor-pointer"
                            onClick={handleRecordType}
                        >
                            <div
                                data-type="income"
                                className={`type-btn basis-1/3 py-5 ${
                                    type === "income" ? "bg-black/20" : ""
                                }`}
                            >
                                Income
                            </div>
                            <div
                                data-type="expense"
                                className={`type-btn basis-1/3 py-5 ${
                                    type === "expense" ? "bg-black/20" : ""
                                }`}
                            >
                                Expense
                            </div>
                            <div
                                data-type="transfer"
                                className={`type-btn basis-1/3 py-5 ${
                                    type === "transfer" ? "bg-black/20" : ""
                                }`}
                            >
                                Transfer
                            </div>
                            <input
                                type="hidden"
                                name="type"
                                value={type}
                            ></input>
                        </div>
                        <div className="basis-5/12 flex flex-row text-7xl text-center items-center gap-x-4 px-5">
                            <div className="basis-1/12 text-4xl">
                                {type === "transfer"
                                    ? ""
                                    : type === "income"
                                    ? "+"
                                    : type === "expense"
                                    ? "-"
                                    : ""}
                            </div>
                            <div className="basis-9/12 text-right">
                                {amount}
                            </div>
                            <input type="hidden" name="amount" value={amount} />
                            <div className="2/12 text-4xl">EUR</div>
                        </div>
                        <div className="basis-2/12 flex flex-row text-center items-center">
                            <div className="basis-1/2 flex flex-col">
                                <div className="text-sm text-gray-300">
                                    Account
                                </div>
                                <div>
                                    <select
                                        name="from_account_id"
                                        id="from_account_id"
                                        className="text-center appearance-none bg-transparent"
                                    >
                                        {accounts.map((acc, index) => {
                                            return (
                                                <option
                                                    className="text-black px-5"
                                                    value={acc.id}
                                                    selected={
                                                        account === acc.id
                                                    }
                                                >
                                                    {acc.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                            {type === "transfer" ? (
                                <div className="basis-1/2 flex flex-col">
                                    <div className="text-sm text-gray-300">
                                        To account
                                    </div>
                                    <div>
                                        <select
                                            name="to_account_id"
                                            id="to_account_id"
                                            className="text-center appearance-none bg-transparent"
                                        >
                                            {accounts.map((acc, index) => {
                                                return (
                                                    <option
                                                        className="text-black"
                                                        value={acc.id}
                                                        selected={
                                                            toAccount === acc.id
                                                        }
                                                    >
                                                        {acc.name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="basis-1/2 flex flex-col"
                                    onClick={handleOpenCategory}
                                >
                                    <div className="text-sm text-gray-300">
                                        Category
                                    </div>
                                    <div>{category.name}</div>
                                    <input
                                        type="hidden"
                                        name="category_id"
                                        value={category.id}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="basis-2/12 flex flex-row text-center items-center">
                            <div className="basis-1/2 flex flex-col">
                                <div className="text-sm text-gray-300">
                                    Date
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        name="date"
                                        className="w-3/4 text-center appearance-none bg-transparent"
                                        onChange={handleInputDate}
                                        value={
                                            date
                                                ? moment(date).format(
                                                      "YYYY-MM-DD"
                                                  )
                                                : moment(new Date()).format(
                                                      "YYYY-MM-DD"
                                                  )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="basis-1/12">
                        <textarea
                            type="text"
                            name="name"
                            className="w-full h-full bg-gray-900 text-gray-200 p-4"
                            placeholder="Description..."
                            onChange={handleInputName}
                            value={name ?? ""}
                        />
                    </div>
                    <div className="basis-5/12">
                        <Calculator value={amount} setValue={setAmount} />
                    </div>
                </div>
            </form>
        </div>
    );
}
