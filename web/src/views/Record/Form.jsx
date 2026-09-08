import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import numeral from "numeral";
import Api from "../../Api/Endpoints";
import Calculator from "./Components/Calculator";
import CategoryPicker from "./Components/CategoryPicker";
import TopNav from "../../layout/TopNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash, faChevronRight, faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";

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
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [showToAccountPicker, setShowToAccountPicker] = useState(false);

    const { record_id } = useParams();

    useEffect(() => {
        async function getData() {
            const accounts = await Api.getAccounts();
            setAccounts(accounts);
            if (record_id !== undefined) {
                const record = await Api.getRecordById(record_id);
                setType(record.type);
                setCategory({
                    id: record.category_id,
                    name: record.category_name,
                });
                setAmount(Math.abs(record.amount));
                setAccount(record.from_account_id);
                setToAccount(record.to_account_id);
                setRecord(record);
                setDate(record.date);
                setName(record.name);
            }
            setIsLoading(false);
        }
        getData();
    }, [record_id]);

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

    const handleBackFunction = async () => {
        window.location.href = "/";
    };

    const handleInputChange = (event) => {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        setRecord({ ...record, [name]: value });
    };

    const handleSaveForm = async () => {
        const formData = new FormData(document.querySelector("form"));
        const formObject = Object.fromEntries(formData.entries());
        await Api.createRecord(formObject, record_id);
        handleBackFunction();
    };

    const handleDeleteRecord = async () => {
        const userConfirmed = window.confirm("Delete this record?");

        if (userConfirmed) {
            await Api.deleteRecord(record_id);
            window.location.href = "/";
        }
    };

    const selectedAccount = accounts?.find((a) => a.id === Number(account));
    const selectedToAccount = accounts?.find((a) => a.id === Number(toAccount));

    const typeLabel =
        type === "income"
            ? "Income"
            : type === "expense"
            ? "Expense"
            : "Transfer";

    const typeColor =
        type === "income"
            ? "text-green-400"
            : type === "expense"
            ? "text-red-400"
            : "text-blue-400";

    const typeBg =
        type === "income"
            ? "bg-green-500/20"
            : type === "expense"
            ? "bg-red-500/20"
            : "bg-blue-500/20";

    const typeAccent =
        type === "income"
            ? "bg-green-500"
            : type === "expense"
            ? "bg-red-500"
            : "bg-blue-500";

    const buttonLabel =
        type === "income"
            ? "Add Income"
            : type === "expense"
            ? "Add Expense"
            : "Add Transfer";

    const amountSign =
        type === "transfer"
            ? ""
            : type === "income"
            ? "+"
            : "-";

    const formatDisplayAmount = (val) => {
        const str = String(val);
        if (str.includes(".")) {
            const dotIndex = str.indexOf(".");
            const intPart = str.slice(0, dotIndex);
            const decPart = str.slice(dotIndex + 1);
            return numeral(intPart).format("0,0") + "." + decPart;
        }
        return numeral(val).format("0,0");
    };

    if (isLoading) {
        return <></>;
    }

    return (
        <div className="bg-[#0a0a0f] min-h-screen">
            {categoryPickerOpen && (
                <CategoryPicker
                    setOpen={setCategoryPickerOpen}
                    setCategory={setCategory}
                />
            )}

            {/* Account picker modal */}
            {showAccountPicker && (
                <AccountPickerModal
                    accounts={accounts}
                    selectedId={account}
                    onSelect={(id) => {
                        setAccount(id);
                        setShowAccountPicker(false);
                    }}
                    onClose={() => setShowAccountPicker(false)}
                    title="Select account"
                />
            )}

            {/* To Account picker modal */}
            {showToAccountPicker && (
                <AccountPickerModal
                    accounts={accounts}
                    selectedId={toAccount}
                    onSelect={(id) => {
                        setToAccount(id);
                        setShowToAccountPicker(false);
                    }}
                    onClose={() => setShowToAccountPicker(false)}
                    title="Select destination"
                />
            )}

            <form>
                <TopNav
                    leftFunction={handleBackFunction}
                    rightFunction={handleSaveForm}
                    rightIcon={faCheck}
                    {...(record_id && {
                        right2Function: handleDeleteRecord,
                        right2Icon: faTrash,
                    })}
                />

                <div className="fixed top-14 bottom-0 left-0 right-0 flex flex-col max-w-full overflow-hidden">
                    {/* Type selector tabs */}
                    <div className="flex flex-row items-center justify-center gap-x-1 px-4 py-3 shrink-0">
                        <div
                            data-type="income"
                            onClick={handleRecordType}
                            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                                type === "income"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "text-gray-500"
                            }`}
                        >
                            Income
                        </div>
                        <div
                            data-type="expense"
                            onClick={handleRecordType}
                            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                                type === "expense"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "text-gray-500"
                            }`}
                        >
                            Expense
                        </div>
                        <div
                            data-type="transfer"
                            onClick={handleRecordType}
                            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                                type === "transfer"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "text-gray-500"
                            }`}
                        >
                            Transfer
                        </div>
                        <input type="hidden" name="type" value={type} />
                    </div>

                    {/* Amount display */}
                    <div className="flex flex-col items-center py-4 shrink-0">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                            {typeLabel}
                        </div>
                        <div className={`flex flex-row items-baseline ${typeColor}`}>
                            <span className="text-2xl font-light mr-1">
                                {amountSign}
                            </span>
                            <span className="text-5xl font-bold tracking-tight">
                                {formatDisplayAmount(amount)}
                            </span>
                        </div>
                        {selectedAccount && (
                            <div className="text-gray-500 text-sm mt-2">
                                Available: {selectedAccount.currency_symbol}{" "}
                                {numeral(selectedAccount.balance).format("0,0.00")}
                            </div>
                        )}
                        <input type="hidden" name="amount" value={amount} />
                    </div>

                    {/* Account card */}
                    {type !== "transfer" ? (
                        <div className="px-4 mb-2 shrink-0">
                            <div
                                className="bg-[#1a1a2e] rounded-2xl p-4 cursor-pointer border border-gray-800"
                                onClick={() => setShowAccountPicker(true)}
                            >
                                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                    Account
                                </div>
                                {selectedAccount ? (
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="flex flex-row items-center gap-x-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                                style={{
                                                    backgroundColor: selectedAccount.color,
                                                }}
                                            >
                                                {selectedAccount.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">
                                                    {selectedAccount.name}
                                                </div>
                                                <div className="text-gray-500 text-sm">
                                                    {selectedAccount.currency_symbol}{" "}
                                                    {numeral(
                                                        selectedAccount.balance
                                                    ).format("0,0.00")}
                                                </div>
                                            </div>
                                        </div>
                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            className="text-gray-600"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        Select an account...
                                    </div>
                                )}
                            </div>
                            <input
                                type="hidden"
                                name="from_account_id"
                                value={account ?? ""}
                            />
                        </div>
                    ) : (
                        /* Transfer: From → To accounts */
                        <div className="px-4 mb-2 flex flex-col gap-y-1.5 shrink-0">
                            <div
                                className="bg-[#1a1a2e] rounded-2xl p-4 cursor-pointer border border-gray-800"
                                onClick={() => setShowAccountPicker(true)}
                            >
                                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                    From
                                </div>
                                {selectedAccount ? (
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="flex flex-row items-center gap-x-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                                style={{
                                                    backgroundColor: selectedAccount.color,
                                                }}
                                            >
                                                {selectedAccount.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">
                                                    {selectedAccount.name}
                                                </div>
                                                <div className="text-gray-500 text-sm">
                                                    {selectedAccount.currency_symbol}{" "}
                                                    {numeral(
                                                        selectedAccount.balance
                                                    ).format("0,0.00")}
                                                </div>
                                            </div>
                                        </div>
                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            className="text-gray-600"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        Select source account...
                                    </div>
                                )}
                            </div>
                            <input
                                type="hidden"
                                name="from_account_id"
                                value={account ?? ""}
                            />

                            {/* <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-[#1a1a2e] border border-gray-700 flex items-center justify-center">
                                    <FontAwesomeIcon
                                        icon={faArrowRightArrowLeft}
                                        className="text-gray-400 text-sm"
                                    />
                                </div>
                            </div> */}

                            <div
                                className="bg-[#1a1a2e] rounded-2xl p-4 cursor-pointer border border-gray-800"
                                onClick={() => setShowToAccountPicker(true)}
                            >
                                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                    To
                                </div>
                                {selectedToAccount ? (
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="flex flex-row items-center gap-x-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                                style={{
                                                    backgroundColor: selectedToAccount.color,
                                                }}
                                            >
                                                {selectedToAccount.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">
                                                    {selectedToAccount.name}
                                                </div>
                                                <div className="text-gray-500 text-sm">
                                                    {selectedToAccount.currency_symbol}{" "}
                                                    {numeral(
                                                        selectedToAccount.balance
                                                    ).format("0,0.00")}
                                                </div>
                                            </div>
                                        </div>
                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            className="text-gray-600"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        Select destination...
                                    </div>
                                )}
                            </div>
                            <input
                                type="hidden"
                                name="to_account_id"
                                value={toAccount ?? ""}
                            />
                        </div>
                    )}

                    {/* Category (non-transfer) */}
                    {type !== "transfer" && (
                        <div className="px-4 mb-2 shrink-0">
                            <div
                                className="bg-[#1a1a2e] rounded-2xl p-4 cursor-pointer border border-gray-800 flex flex-row items-center justify-between"
                                onClick={handleOpenCategory}
                            >
                                <div className="flex flex-row items-center gap-x-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            category.id
                                                ? "text-white"
                                                : "bg-gray-800 text-gray-500"
                                        }`}
                                        style={
                                            category.id
                                                ? {
                                                      backgroundColor:
                                                          category.color || "#4b5563",
                                                  }
                                                : {}
                                        }
                                    >
                                        {category.id ? (
                                            category.icon ? (
                                                <FontAwesomeIcon
                                                    icon={category.icon}
                                                />
                                            ) : (
                                                category.name.charAt(0)
                                            )
                                        ) : (
                                            <span>?</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs uppercase tracking-wider">
                                            Category
                                        </div>
                                        <div className="text-white font-medium">
                                            {category.name || "Select category"}
                                        </div>
                                    </div>
                                </div>
                                <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="text-gray-600"
                                />
                            </div>
                            <input
                                type="hidden"
                                name="category_id"
                                value={category.id}
                            />
                        </div>
                    )}

                    {/* Date and Description row */}
                    <div className="px-4 mb-2 flex flex-row gap-x-3 shrink-0">
                        <div className="flex-1 bg-[#1a1a2e] rounded-2xl p-4 border border-gray-800">
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                Date
                            </div>
                            <input
                                type="date"
                                name="date"
                                className="w-full bg-transparent text-white outline-none cursor-pointer [color-scheme:dark]"
                                onChange={handleInputDate}
                                value={
                                    date
                                        ? moment(date).format("YYYY-MM-DD")
                                        : moment(new Date()).format("YYYY-MM-DD")
                                }
                            />
                        </div>
                        <div className="flex-[2] bg-[#1a1a2e] rounded-2xl p-4 border border-gray-800">
                            <input
                                type="text"
                                name="name"
                                className="w-full bg-transparent text-white outline-none placeholder-gray-500"
                                placeholder="Description..."
                                onChange={handleInputName}
                                value={name ?? ""}
                            />
                        </div>
                    </div>

                    {/* Exchange rate (transfer with different currencies) */}
                    {record?.from_account_id &&
                        record?.to_account_id &&
                        accounts?.find(
                            (a) => a.id === Number(record?.from_account_id)
                        )?.currency_code !==
                            accounts?.find(
                                (a) => a.id === Number(record?.to_account_id)
                            )?.currency_code && (
                            <div className="px-4 mb-2 shrink-0">
                                <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-gray-800">
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                        Exchange rate
                                    </div>
                                    <div className="flex flex-row items-center gap-x-2">
                                        <input
                                            type="number"
                                            step="any"
                                            name="rate"
                                            id="rate"
                                            onChange={handleInputChange}
                                            defaultValue={record?.rate ?? 1}
                                            className="flex-1 bg-transparent text-white outline-none [color-scheme:dark]"
                                            required
                                        />
                                        {accounts.length &&
                                            record.from_account_id &&
                                            record.to_account_id && (
                                                <span className="text-gray-500 text-xs">
                                                    1.00{" "}
                                                    {
                                                        accounts.find(
                                                            (item) =>
                                                                item.id ===
                                                                Number(
                                                                    record.from_account_id
                                                                )
                                                        ).currency_code
                                                    }{" "}
                                                    = {record?.rate ?? 1}{" "}
                                                    {
                                                        accounts.find(
                                                            (item) =>
                                                                item.id ===
                                                                Number(
                                                                    record.to_account_id
                                                                )
                                                        ).currency_code
                                                    }
                                                </span>
                                            )}
                                    </div>
                                </div>
                            </div>
                    )}

                    {/* Keypad */}
                    <div className="flex-1">
                        <Calculator value={amount} setValue={setAmount} />
                    </div>

                    {/* Send button */}
                    <div className="px-4 py-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleSaveForm}
                            className={`w-full py-3.5 rounded-2xl text-white font-semibold text-lg transition-all ${typeAccent} active:scale-[0.98]`}
                        >
                            {buttonLabel}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

/* Account Picker Modal */
function AccountPickerModal({ accounts, selectedId, onSelect, onClose, title }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
            <TopNav leftFunction={onClose} />
            <div className="h-full mt-14 bg-[#0a0a0f] flex flex-col gap-y-2 text-lg p-5">
                <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                    {title}
                </div>
                {accounts?.map((acc) => (
                    <div
                        key={acc.id}
                        className={`flex flex-row items-center gap-x-4 p-4 rounded-2xl cursor-pointer transition-all ${
                            Number(selectedId) === acc.id
                                ? "bg-[#1a1a2e] border border-gray-600"
                                : "bg-[#12121f] border border-transparent"
                        }`}
                        onClick={() => onSelect(acc.id)}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: acc.color }}
                        >
                            {acc.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-medium">{acc.name}</div>
                            <div className="text-gray-500 text-sm">
                                {acc.currency_symbol}{" "}
                                {numeral(acc.balance).format("0,0.00")}
                            </div>
                        </div>
                        {Number(selectedId) === acc.id && (
                            <FontAwesomeIcon
                                icon={faCheck}
                                className="text-blue-400"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
