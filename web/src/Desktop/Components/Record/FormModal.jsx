import React, { useEffect, useState, useRef, useCallback } from "react";
import moment from "moment";
import numeral from "numeral";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Api from "../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import {
    Modal,
    ModalContent,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Button,
} from "@nextui-org/react";

const typeConfig = {
    income: { color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", accent: "bg-green-500", label: "Income", sign: "+" },
    expense: { color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", accent: "bg-red-500", label: "Expense", sign: "−" },
    transfer: { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", accent: "bg-blue-500", label: "Transfer", sign: "" },
};

// Module-level cache to survive component unmount/remount
let cachedAccounts = null;
let cachedParentCategories = null;
const categoriesByParentCache = {};

const fetchAccountsOnce = async () => {
    if (!cachedAccounts) {
        cachedAccounts = await Api.getAccounts();
    }
    return cachedAccounts;
};

const fetchParentCategoriesOnce = async () => {
    if (!cachedParentCategories) {
        cachedParentCategories = await Api.getParentCategories();
    }
    return cachedParentCategories;
};

const fetchCategoriesByParentOnce = async (parentId) => {
    if (!categoriesByParentCache[parentId]) {
        categoriesByParentCache[parentId] = await Api.getCategoriesByParent(parentId);
    }
    return categoriesByParentCache[parentId];
};

export default function FormModal({ isOpen, onOpenChange, record_id, recordData, accounts: accountsProp, parentCategories: parentCategoriesProp, fetchAgain, setIsRemoved, onRecordChange }) {
    const [accounts, setAccounts] = useState(accountsProp || []);
    const [loading, setLoading] = useState(false);
    const [parentCategories, setParentCategories] = useState(parentCategoriesProp || []);
    const [categories, setCategories] = useState([]);
    const [record, setRecord] = useState(null);
    const [type, setType] = useState("");
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [parentCategory, setParentCategory] = useState(null);
    const [category, setCategory] = useState(null);
    const [name, setName] = useState('');
    const [date, setDate] = useState(null);
    const [amount, setAmount] = useState(0);
    const [typeError, setTypeError] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const formRef = useRef();

    const tc = typeConfig[type] || {};

    useEffect(() => {
        async function getData() {
            // Prefer cache (freshest, updated after saves) > props > fetch
            if (cachedAccounts) {
                setAccounts(cachedAccounts);
            } else if (accountsProp?.length) {
                setAccounts(accountsProp);
            } else {
                const data = await fetchAccountsOnce();
                setAccounts(data);
            }
            if (cachedParentCategories) {
                setParentCategories(cachedParentCategories);
            } else if (parentCategoriesProp?.length) {
                setParentCategories(parentCategoriesProp);
            } else {
                const data = await fetchParentCategoriesOnce();
                setParentCategories(data);
            }

            // Use recordData prop if provided (instant), otherwise fetch from API
            if (recordData) {
                setRecord(recordData);
                setFromAccount(recordData.from_account_id);
                setToAccount(recordData.to_account_id);
                setParentCategory(recordData.parent_category_id);
                setCategory(recordData.category_id);
                setType(recordData.type);
                setName(recordData.name);
                setDate(moment(recordData.date).format("YYYY-MM-DD"));
                setAmount(Math.abs(recordData.amount));
            } else if (record_id !== undefined) {
                const record = await Api.getRecordById(record_id);
                setRecord(record);
                setFromAccount(record.from_account_id);
                setToAccount(record.to_account_id);
                setParentCategory(record.parent_category_id);
                setCategory(record.category_id);
                setType(record.type);
                setName(record.name);
                setDate(moment(record.date).format("YYYY-MM-DD"));
                setAmount(Math.abs(record.amount));
            }
        }
        getData();
    }, [isOpen, record_id, recordData, accountsProp, parentCategoriesProp]);

    useEffect(() => {
        async function getCategories() {
            const data = await fetchCategoriesByParentOnce(parentCategory);
            setCategories(data);
        }
        if (parentCategory) {
            getCategories();
        }
    }, [parentCategory]);

    const resetForm = () => {
        setType("");
        setToAccount('');
        setName('');
        setAmount(0);
    };

    const doSave = useCallback(async (isSaveAndNew) => {
        if (!type) {
            setTypeError(true);
            return;
        }
        setTypeError(false);

        const currentForm = formRef.current;
        if (!currentForm) {
            console.error("Form reference not found");
            return;
        }

        setLoading(true);
        const formData = new FormData(currentForm);
        formData.set("amount", amount);
        const formObject = Object.fromEntries(formData.entries());
        await Api.createRecord(formObject, record_id);

        if (record) fetchAgain();
        if (onRecordChange) onRecordChange();
        await refreshAccounts();

        setLoading(false);

        if (isSaveAndNew) {
            resetForm();
        } else {
            onOpenChange();
        }
    }, [type, amount, record_id, record, fetchAgain, onRecordChange, onOpenChange]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        doSave(true);
    };

    const refreshAccounts = async () => {
        cachedAccounts = null; // Invalidate cache so next fetch gets fresh data
        const fetchAccounts = await fetchAccountsOnce();
        setAccounts(fetchAccounts);
    };

    const handleDeleteRecord = async () => {
        setLoading(true);
        await Api.deleteRecord(record_id);
        if (onRecordChange) onRecordChange();
        setIsRemoved(true);
        setLoading(false);
        setShowDeleteConfirm(false);
        onOpenChange();
    };

    const selectedAccount = accounts.find(a => a.id === Number(fromAccount));
    const selectedToAccount = accounts.find(a => a.id === Number(toAccount));
    const selectedParentCategory = parentCategories.find(pc => pc.id === Number(parentCategory));
    const selectedCategory = categories.find(c => c.id === Number(category));

    const fromCurrency = selectedAccount?.currency_code;
    const toCurrency = selectedToAccount?.currency_code;
    const showExchangeRate = type === "transfer" && fromAccount && toAccount && fromCurrency && toCurrency && fromCurrency !== toCurrency;
    const isEditing = !!record;

    const buttonLabel = type
        ? (type === "income" ? "Add Income" : type === "expense" ? "Add Expense" : "Send Transfer")
        : "Save";

    const selectClassNames = {
        base: "w-full",
        trigger: "bg-transparent shadow-none border-0 h-auto min-h-[36px] py-1.5 px-0 data-[hover=true]:!bg-transparent data-[hover=true]:opacity-80",
        innerWrapper: "pt-0",
        value: "text-white font-medium text-sm",
        listbox: "bg-[#1a1a2e] text-white [&_li]:data-[hover=true]:!bg-[#252540] [&_li]:data-[hover=true]:!text-white",
        popoverContent: "bg-[#1a1a2e] border border-gray-700 text-white",
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="top-center"
            size="lg"
            classNames={{
                base: "max-w-[460px] bg-[#0a0a0f] overflow-visible",
                body: "p-0 overflow-visible",
                content: "bg-[#0a0a0f] overflow-visible",
                closeButton: "text-gray-400 hover:bg-[#1a1a2e]",
            }}
            motionProps={{
                variants: {
                    enter: { scale: 1, opacity: 1, transition: { type: "spring", duration: 0.3 } },
                    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
                },
            }}
        >
            <ModalContent className="relative">
                <form onSubmit={handleFormSubmit} ref={formRef} id="recordForm" className="block">
                    <ModalBody className="gap-0 p-0">
                        {/* Type selector tabs */}
                        <div className="flex flex-row gap-x-1.5 px-5 pt-5 pb-3">
                            {Object.entries(typeConfig).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setType(key); setTypeError(false); }}
                                    className={`flex-1 text-center py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all hover:opacity-80 ${
                                        type === key
                                            ? `${cfg.bg} ${cfg.color} ${cfg.border} border`
                                            : "text-gray-500 bg-[#1a1a2e] border border-transparent hover:text-gray-300 hover:bg-[#22223a]"
                                    }`}
                                >
                                    {cfg.label}
                                </button>
                            ))}
                            <input type="hidden" name="type" value={type} />
                        </div>
                        {typeError && (
                            <p className="text-red-400 text-xs px-5 -mt-1 mb-2">Select a type: Income, Expense or Transfer</p>
                        )}

                        {/* Amount display */}
                        <div className="flex flex-col items-center py-4">
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                {tc.label || "Select type"}
                            </div>
                            <div className={`flex flex-row items-center justify-center gap-x-1 ${tc.color || "text-gray-400"}`}>
                                <span className="text-3xl font-light">{tc.sign}</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    name="amount"
                                    required
                                    className={`bg-transparent text-center outline-none border-0 text-4xl font-bold tracking-tight w-48 placeholder-gray-600 ${tc.color || "text-gray-400"}`}
                                    placeholder="0"
                                    value={amount || ""}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            {selectedAccount && (
                                <div className="text-gray-500 text-xs mt-1">
                                    Available: {selectedAccount.currency_symbol}{" "}
                                    {numeral(selectedAccount.balance).format("0,0.00")}
                                </div>
                            )}
                        </div>

                        <div className="px-5 flex flex-col gap-y-2">
                            {/* Account / Transfer accounts */}
                            {type !== "transfer" ? (
                                <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Account</div>
                                    <Select
                                        isRequired
                                        placeholder="Select account"
                                        name="from_account_id"
                                        size="sm"
                                        items={accounts}
                                        selectionMode="single"
                                        selectedKeys={fromAccount ? [fromAccount.toString()] : []}
                                        onChange={e => setFromAccount(e.target.value)}
                                        classNames={selectClassNames}
                                        renderValue={() => (
                                            <div className="flex flex-row items-center gap-x-2">
                                                {selectedAccount && (
                                                    <>
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: selectedAccount.color }}>
                                                            {selectedAccount.name.charAt(0)}
                                                        </div>
                                                        <span className="text-white text-sm">{selectedAccount.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    >
                                        {(item) => (
                                            <SelectItem key={item.id} value={item.id}
                                                startContent={
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: item.color || '#666' }}>
                                                        {item.name.charAt(0)}
                                                    </div>
                                                }
                                                endContent={
                                                    <span className="text-gray-400 text-xs">{item.currency_symbol} {numeral(item.balance).format("0,0.00")}</span>
                                                }
                                            >
                                                {item.name}
                                            </SelectItem>
                                        )}
                                    </Select>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
                                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">From</div>
                                        <Select
                                            isRequired
                                            placeholder="Select source"
                                            name="from_account_id"
                                            size="sm"
                                            items={accounts}
                                            selectionMode="single"
                                            selectedKeys={fromAccount ? [fromAccount.toString()] : []}
                                            onChange={e => setFromAccount(e.target.value)}
                                            classNames={selectClassNames}
                                            renderValue={() => (
                                                <div className="flex flex-row items-center gap-x-2">
                                                    {selectedAccount && (
                                                        <>
                                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: selectedAccount.color }}>
                                                                {selectedAccount.name.charAt(0)}
                                                            </div>
                                                            <span className="text-white text-sm">{selectedAccount.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        >
                                            {(item) => (
                                                <SelectItem key={item.id} value={item.id}
                                                    startContent={
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: item.color || '#666' }}>
                                                            {item.name.charAt(0)}
                                                        </div>
                                                    }
                                                >
                                                    {item.name}
                                                </SelectItem>
                                            )}
                                        </Select>
                                    </div>
                                    <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
                                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">To</div>
                                        <Select
                                            isRequired
                                            placeholder="Select destination"
                                            name="to_account_id"
                                            size="sm"
                                            items={accounts}
                                            selectionMode="single"
                                            selectedKeys={toAccount ? [toAccount.toString()] : []}
                                            onChange={e => setToAccount(e.target.value)}
                                            classNames={selectClassNames}
                                            renderValue={() => (
                                                <div className="flex flex-row items-center gap-x-2">
                                                    {selectedToAccount && (
                                                        <>
                                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: selectedToAccount.color }}>
                                                                {selectedToAccount.name.charAt(0)}
                                                            </div>
                                                            <span className="text-white text-sm">{selectedToAccount.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        >
                                            {(item) => (
                                                <SelectItem key={item.id} value={item.id}
                                                    startContent={
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: item.color || '#666' }}>
                                                            {item.name.charAt(0)}
                                                        </div>
                                                    }
                                                >
                                                    {item.name}
                                                </SelectItem>
                                            )}
                                        </Select>
                                    </div>
                                </>
                            )}

                            {/* Category (non-transfer) */}
                            {type !== "transfer" && (
                                <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Category</div>
                                    <div className="flex flex-row gap-x-2">
                                        <div className="flex-1">
                                            <Select
                                                isRequired
                                                placeholder="Parent"
                                                name="parent_category_id"
                                                size="sm"
                                                items={parentCategories}
                                                selectionMode="single"
                                                selectedKeys={parentCategory ? [parentCategory.toString()] : []}
                                                onChange={e => setParentCategory(e.target.value)}
                                                classNames={selectClassNames}
                                                renderValue={() => (
                                                    <div className="flex flex-row items-center gap-x-2">
                                                        {selectedParentCategory && (
                                                            <>
                                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: selectedParentCategory.color }}>
                                                                    <FontAwesomeIcon icon={selectedParentCategory.icon} />
                                                                </div>
                                                                <span className="text-white text-sm">{selectedParentCategory.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            >
                                                {(pc) => (
                                                    <SelectItem key={pc.id} value={pc.id}
                                                        startContent={
                                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: pc.color }}>
                                                                <FontAwesomeIcon icon={pc.icon} />
                                                            </div>
                                                        }
                                                    >
                                                        {pc.name}
                                                    </SelectItem>
                                                )}
                                            </Select>
                                        </div>
                                        <div className="flex-1">
                                            <Select
                                                isRequired
                                                placeholder="Subcategory"
                                                name="category_id"
                                                size="sm"
                                                items={categories}
                                                selectionMode="single"
                                                selectedKeys={category ? [category.toString()] : []}
                                                onChange={e => setCategory(e.target.value)}
                                                classNames={selectClassNames}
                                                renderValue={() => (
                                                    <div className="flex flex-row items-center gap-x-2">
                                                        {selectedCategory && (
                                                            <>
                                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: selectedCategory.color }}>
                                                                    <FontAwesomeIcon icon={selectedCategory.icon} />
                                                                </div>
                                                                <span className="text-white text-sm">{selectedCategory.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            >
                                                {(cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}
                                                        startContent={
                                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: cat.color }}>
                                                                <FontAwesomeIcon icon={cat.icon} />
                                                            </div>
                                                        }
                                                    >
                                                        {cat.name}
                                                    </SelectItem>
                                                )}
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Date and Description */}
                            <div className="flex flex-row gap-x-2">
                                <div className="flex-1 bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Date</div>
                                    <DatePicker
                                        selected={date ? new Date(date) : null}
                                        onChange={(d) => setDate(d ? moment(d).format("YYYY-MM-DD") : null)}
                                        customInput={
                                            <input
                                                className="w-full bg-transparent text-white text-sm outline-none cursor-pointer [color-scheme:dark]"
                                                placeholder="Select date"
                                                readOnly
                                            />
                                        }
                                        dateFormat="yyyy-MM-dd"
                                        wrapperClassName="w-full"
                                        popperPlacement="bottom"
                                        popperModifiers={[
                                            { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
                                            { name: "flip", enabled: false },
                                        ]}
                                    />
                                    <input type="hidden" name="date" value={date ?? ""} />
                                </div>
                                <div className="flex-[2] bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
                                    <input
                                        type="text"
                                        name="name"
                                        className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-500"
                                        placeholder="Description..."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Exchange rate */}
                            {showExchangeRate && (
                                <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Exchange rate</div>
                                    <div className="flex flex-row items-center gap-x-2">
                                        <input
                                            type="number"
                                            step="any"
                                            name="rate"
                                            className="flex-1 bg-transparent text-white text-sm outline-none [color-scheme:dark]"
                                            placeholder="1.00"
                                            required
                                            defaultValue={record?.rate}
                                        />
                                        <span className="text-gray-500 text-xs">
                                            1 {fromCurrency} = {record?.rate ?? "?"} {toCurrency}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </ModalBody>

                    <ModalFooter className="pt-3 pb-4 px-5 border-t border-gray-800/50">
                        <div className="flex flex-row gap-x-3 w-full">
                            {isEditing ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="light"
                                        size="md"
                                        isLoading={loading}
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex-1 h-12 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium"
                                        startContent={!loading && <FontAwesomeIcon icon={faTrash} />}
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        type="button"
                                        size="md"
                                        isLoading={loading}
                                        onClick={() => doSave(false)}
                                        className="flex-1 h-12 bg-green-500 text-white hover:bg-green-600 font-medium"
                                    >
                                        Save
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="flat"
                                        size="md"
                                        onClick={() => doSave(false)}
                                        className="flex-1 h-12 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-medium"
                                    >
                                        Save & Close
                                    </Button>
                                    <Button
                                        type="button"
                                        size="md"
                                        isLoading={loading}
                                        onClick={() => doSave(true)}
                                        className="flex-1 h-12 bg-green-500 text-white hover:bg-green-600 font-medium"
                                        endContent={!loading && <FontAwesomeIcon icon={faPlus} />}
                                    >
                                        Save & New
                                    </Button>
                                </>
                            )}
                        </div>
                    </ModalFooter>
                </form>

                {/* Delete confirmation overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]/95 rounded-2xl">
                        <div className="text-center px-6">
                            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <FontAwesomeIcon icon={faTrash} className="text-red-400 text-xl" />
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">Delete record?</h3>
                            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
                            <div className="flex flex-row gap-x-3">
                                <Button
                                    variant="flat"
                                    size="md"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 bg-[#1a1a2e] text-gray-300 hover:bg-[#2a2a3e]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="md"
                                    isLoading={loading}
                                    onClick={handleDeleteRecord}
                                    className="flex-1 bg-red-500 text-white hover:bg-red-600"
                                    startContent={!loading && <FontAwesomeIcon icon={faTrash} />}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}
