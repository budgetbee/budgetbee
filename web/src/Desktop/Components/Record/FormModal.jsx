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

    // Editing a movement that already exists. Its category is what the user chose
    // when he saved it, so there is nothing to predict and the rules do not get a
    // say here: they only suggest while a NEW movement is being written.
    const isExistingRecord = Boolean(record_id) || Boolean(recordData?.id);

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
            // Disabled subcategories are hidden when picking a category for
            // a record, except the one already assigned to the record being
            // edited (its name/icon must keep showing).
            setCategories(
                data.filter(
                    (c) =>
                        c.enabled !== false ||
                        (category && Number(c.id) === Number(category))
                )
            );
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

    // What the categoriser thinks, while the user types the description.
    const [suggestion, setSuggestion] = useState(null);
    const [saveError, setSaveError] = useState("");
    const [allCategories, setAllCategories] = useState(null);
    // Once the user picks a category by hand, suggestions stop touching it.
    const categoryTouched = useRef(false);
    // The category that is currently there because the rules suggested it (null
    // when there is no suggestion or when he picked it himself).
    const suggestedId = useRef(null);

    // Take back a suggestion. It never touches a category picked by hand: that
    // one marks the form as touched and this stops being called.
    const clearSuggestion = () => {
        if (suggestedId.current === null) {
            return;
        }
        suggestedId.current = null;
        setSuggestion(null);
        setCategory("");
        setParentCategory("");
    };

    useEffect(() => {
        if (allCategories !== null) {
            return;
        }
        Api.getCategories()
            .then((data) => setAllCategories(data || []))
            .catch(() => setAllCategories([]));
    }, [allCategories]);

    // Type a name and the app asks its own rules what this movement usually is,
    // and fills the category in. Same categoriser the imports use — deterministic,
    // no AI. A hand-picked category always wins, and an existing movement is never
    // touched: it already has the category the user gave it when he saved it.
    useEffect(() => {
        if (isExistingRecord || type === "transfer" || categoryTouched.current) {
            return;
        }

        const text = (name || "").trim();
        if (text.length < 4) {
            // Too little to recognise anything: nothing to suggest.
            clearSuggestion();
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const result = await Api.predictCategoryByRules(text);
                // The endpoint answers { merchant_key, prediction: { category_id, ... } }.
                const prediction = result?.prediction;
                if (categoryTouched.current) {
                    return;
                }

                if (!prediction?.category_id) {
                    // No rule knows what he is typing: take the suggestion back, so
                    // the form never keeps a category the text no longer justifies.
                    clearSuggestion();
                    return;
                }

                const parentOf = (allCategories || []).find(
                    (c) => Number(c.id) === Number(prediction.category_id)
                )?.parent_category_id;
                if (parentOf) {
                    setParentCategory(parentOf);
                }
                setCategory(prediction.category_id);
                suggestedId.current = prediction.category_id;
                setSuggestion({ id: prediction.category_id, name: prediction.category_name, source: prediction.source });
            } catch (e) {
                // A suggestion is a nicety: never get in the way of the form.
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [name, type, allCategories, isExistingRecord]);

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
        setSaveError("");
        const formData = new FormData(currentForm);
        formData.set("amount", amount);
        // An empty category must not travel as "": the API would reject it and the
        // modal would close as if everything had gone fine.
        if (!category) {
            formData.delete("category_id");
        }
        if (!parentCategory) {
            formData.delete("parent_category_id");
        }
        const formObject = Object.fromEntries(formData.entries());

        try {
            const response = await Api.createRecord(formObject, record_id);
            if (response && (response.error || response.errors || response.message === undefined && response.id === undefined)) {
                setSaveError(response.error || "The movement could not be saved. Check the fields.");
                setLoading(false);
                return;
            }
        } catch (e) {
            setSaveError(e?.message || "The movement could not be saved. Check the fields.");
            setLoading(false);
            return;   // keep the modal open instead of closing on a silent failure
        }

        if (record) fetchAgain();
        if (onRecordChange) onRecordChange();
        await refreshAccounts();

        setLoading(false);

        if (isSaveAndNew) {
            resetForm();
        } else {
            onOpenChange();
        }
    }, [type, amount, category, parentCategory, record_id, record, fetchAgain, onRecordChange, onOpenChange]);

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

    // Disabled parents are hidden when picking a category for a record,
    // except the one already assigned to the record being edited.
    const visibleParentCategories = parentCategories.filter(
        (p) =>
            p.enabled !== false ||
            (parentCategory && Number(p.id) === Number(parentCategory))
    );
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

                            {/* Description, right under the amount: it is the concept,
                                the first thing he types, and what the rules read to
                                suggest a category. Same black as the amount — the
                                input is transparent — with a border around it. */}
                            <div className="w-full px-5 mt-3">
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full bg-transparent border border-gray-800 focus:border-emerald-500/60 rounded-2xl px-4 py-2.5 text-white text-sm outline-none placeholder-gray-600 transition-colors"
                                    placeholder="Description..."
                                    value={name}
                                    onChange={e => setName(e.target.value)}
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
                                                items={visibleParentCategories}
                                                selectionMode="single"
                                                selectedKeys={parentCategory ? [parentCategory.toString()] : []}
                                                onChange={e => { categoryTouched.current = true; suggestedId.current = null; setSuggestion(null); setParentCategory(e.target.value); }}
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
                                                onChange={e => { categoryTouched.current = true; suggestedId.current = null; setSuggestion(null); setCategory(e.target.value); }}
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

                            {suggestion && Number(category) === Number(suggestion.id) && (
                                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                                    <span>Suggested from your rules: {suggestion.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            suggestedId.current = null;
                                            setSuggestion(null);
                                            setCategory("");
                                            setParentCategory("");
                                        }}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            {/* Date. The description is not here any more: it lives
                                under the amount, at the top of the form. */}
                            <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
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

                    {saveError && (
                        <div className="mx-5 mb-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                            {saveError}
                        </div>
                    )}

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