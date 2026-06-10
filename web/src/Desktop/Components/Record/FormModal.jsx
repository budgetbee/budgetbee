import React, { useEffect, useState, useRef, useCallback } from "react";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Api from "../../../Api/Endpoints";
import SelectType from "./SelectType";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Modal,
    ModalContent,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Input,
    Button,
} from "@nextui-org/react";

const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <Input
        ref={ref}
        label="Date"
        placeholder={placeholder}
        value={value || ""}
        onClick={onClick}
        readOnly
        className="w-full cursor-pointer"
        size="sm"
    />
));
CustomDateInput.displayName = "CustomDateInput";

export default function FormModal({ isOpen, onOpenChange, record_id, fetchAgain, setIsRemoved, onRecordChange }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [record, setRecord] = useState(null);
    const [type, setType] = useState("");
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [parentCategory, setParentCategory] = useState(null);
    const [category, setCategory] = useState(null);
    const [name, setName] = useState('');
    const [date, setDate] = useState(null);
    const [amount, setAmount] = useState('');
    const [typeError, setTypeError] = useState(false);
    const formRef = useRef();
    const amountRef = useRef();

    useEffect(() => {
        async function getData() {
            const fetchAccounts = await Api.getAccounts();
            const parentCategories = await Api.getParentCategories();
            setAccounts(fetchAccounts);
            setParentCategories(parentCategories);
            if (record_id !== undefined) {
                const record = await Api.getRecordById(record_id);
                setRecord(record);
                setFromAccount(record.from_account_id);
                setToAccount(record.to_account_id);
                setParentCategory(record.parent_category_id);
                setCategory(record.category_id);
                setType(record.type);
                setName(record.name);
                setDate(moment(record.date).format("YYYY-MM-DD"));
                setAmount(record.amount);
            }
        }
        getData();
    }, [isOpen]);

    // Auto-focus amount field when modal opens for a new record
    useEffect(() => {
        if (isOpen && !record_id && amountRef.current) {
            const timer = setTimeout(() => {
                amountRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, record_id]);

    useEffect(() => {
        async function getCategories() {
            const categories = await Api.getCategoriesByParent(
                parentCategory
            );
            setCategories(categories);
        }
        if (parentCategory) {
            getCategories();
        }
    }, [parentCategory]);

    const handleConceptChange = (e) => {
        setName(e.target.value);
    };

    const resetForm = () => {
        const currentDate = date;
        const currentFromAccount = fromAccount;
        const currentParentCategory = parentCategory;
        const currentCategory = category;
        setType("");
        setFromAccount(currentFromAccount);
        setToAccount('');
        setParentCategory(currentParentCategory);
        setCategory(currentCategory);
        setName('');
        setDate(currentDate);
        setAmount('');
        setCategories([]);
        // Re-focus amount after reset
        setTimeout(() => amountRef.current?.focus(), 50);
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
        const formObject = Object.fromEntries(formData.entries());
        await Api.createRecord(formObject, record_id);

        if (record) {
            fetchAgain();
        }

        if (onRecordChange) {
            onRecordChange();
        }

        setLoading(false);

        if (isSaveAndNew) {
            resetForm();
        } else {
            onOpenChange();
        }
    }, [type, record_id, record, fetchAgain, onRecordChange, onOpenChange, resetForm]);

    // Enter key always triggers Save & New
    const handleFormSubmit = (e) => {
        e.preventDefault();
        doSave(true);
    };

    const handleDeleteRecord = async () => {
        const userConfirmed = window.confirm("Delete this record?");

        if (userConfirmed) {
            await Api.deleteRecord(record_id);
            if (onRecordChange) {
                onRecordChange();
            }
            onOpenChange();
        }
        setLoading(false);
        setIsRemoved(true);
    };

    const fromCurrency = accounts.find(a => a.id === Number(fromAccount))?.currency_code;
    const toCurrency = accounts.find(a => a.id === Number(toAccount))?.currency_code;
    const showExchangeRate = type === "transfer" && fromAccount && toAccount && fromCurrency && toCurrency && fromCurrency !== toCurrency;
    const isEditing = !!record;

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="top-center"
            size="lg"
            classNames={{ base: "max-w-[520px] overflow-visible", body: "overflow-visible", content: "overflow-visible" }}
        >
            <ModalContent>
                <form
                    onSubmit={handleFormSubmit}
                    ref={formRef}
                    id="recordForm"
                    className="block"
                >
                    <ModalBody className="gap-3 pt-6 pb-2 overflow-visible">
                        <SelectType
                            onChange={e => { setType(e.target.value); setTypeError(false); }}
                            value={type}
                        />
                        {typeError && (
                            <p className="text-danger text-xs -mt-1">Select a type: Income, Expense or Transfer</p>
                        )}

                        <div className="flex flex-row gap-x-3">
                            <Select
                                isRequired
                                label="Account"
                                placeholder="Select"
                                name="from_account_id"
                                className="flex-1"
                                size="sm"
                                items={accounts}
                                selectionMode="single"
                                selectedKeys={fromAccount ? [fromAccount.toString()] : []}
                                onChange={e => setFromAccount(e.target.value)}
                            >
                                {(item) => (
                                    <SelectItem key={item.id} value={item.id}
                                        startContent={
                                            <span
                                                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color || '#666' }}
                                            />
                                        }
                                        endContent={
                                            <span className="text-default-400 text-xs">{item.currency_symbol}</span>
                                        }
                                    >
                                        {item.name}
                                    </SelectItem>
                                )}
                            </Select>

                            {type === "transfer" && (
                                <Select
                                    isRequired
                                    label="To account"
                                    placeholder="Select"
                                    name="to_account_id"
                                    className="flex-1"
                                    size="sm"
                                    selectionMode="single"
                                    selectedKeys={toAccount ? [toAccount.toString()] : []}
                                    onChange={e => setToAccount(e.target.value)}
                                >
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}
                                            startContent={
                                                <span
                                                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: account.color || '#666' }}
                                                />
                                            }
                                            endContent={
                                                <span className="text-default-400 text-xs">{account.currency_symbol}</span>
                                            }
                                        >
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </div>

                        {type !== "transfer" && (
                            <div className="flex flex-row gap-x-3">
                                <Select
                                    className="flex-1"
                                    label="Category"
                                    name="parent_category_id"
                                    size="sm"
                                    isRequired
                                    selectedKeys={parentCategory ? [parentCategory.toString()] : []}
                                    onChange={e => setParentCategory(e.target.value)}
                                >
                                    {parentCategories.map((pc) => (
                                        <SelectItem
                                            key={pc.id}
                                            value={pc.id}
                                            startContent={
                                                <FontAwesomeIcon
                                                    icon={pc.icon}
                                                    className="text-white rounded-full p-1.5 text-xs flex items-center justify-center"
                                                    style={{ background: pc.color }}
                                                />
                                            }
                                        >
                                            {pc.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Select
                                    className="flex-1"
                                    label="Subcategory"
                                    name="category_id"
                                    size="sm"
                                    isRequired
                                    selectedKeys={category ? [category.toString()] : []}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    {categories.map((cat) => (
                                        <SelectItem
                                            key={cat.id}
                                            value={cat.id}
                                            startContent={
                                                <FontAwesomeIcon
                                                    icon={cat.icon}
                                                    className="text-white rounded-full p-1.5 text-xs flex items-center justify-center"
                                                    style={{ background: cat.color }}
                                                />
                                            }
                                        >
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        )}

                        <div className="flex flex-row gap-x-4 items-end my-3">
                            <Input
                                ref={amountRef}
                                isRequired
                                name="amount"
                                type="number"
                                label="Amount"
                                placeholder="0.00"
                                className="flex-[2]"
                                size="sm"
                                step="any"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                classNames={{
                                    input: "text-base font-semibold",
                                }}
                            />
                            <div className="flex-1 min-w-[130px]">
                                <DatePicker
                                    selected={date ? new Date(date) : null}
                                    onChange={(d) => setDate(d ? moment(d).format("YYYY-MM-DD") : null)}
                                    customInput={<CustomDateInput placeholder="Date" />}
                                    wrapperClassName="w-full"
                                    dateFormat="yyyy-MM-dd"
                                    popperPlacement="bottom"
                                    popperModifiers={[
                                        { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
                                        { name: "flip", enabled: false },
                                    ]}
                                />
                                <input type="hidden" name="date" value={date ?? ""} />
                            </div>
                        </div>

                        <Input
                            label="Description"
                            name="name"
                            placeholder="Optional note..."
                            className="w-full"
                            size="sm"
                            value={name}
                            onChange={handleConceptChange}
                        />

                        {showExchangeRate && (
                            <Input
                                isRequired
                                name="rate"
                                type="number"
                                label={`Exchange rate (1 ${fromCurrency} = ? ${toCurrency})`}
                                placeholder="1.00"
                                className="w-full"
                                size="sm"
                                step="any"
                                defaultValue={record?.rate}
                            />
                        )}
                    </ModalBody>

                    <ModalFooter className="justify-between pt-0 pb-4">
                        <div>
                            {isEditing && (
                                <Button
                                    type="button"
                                    color="danger"
                                    variant="light"
                                    size="sm"
                                    isLoading={loading}
                                    onClick={handleDeleteRecord}
                                    startContent={!loading && <FontAwesomeIcon icon="fa-solid fa-trash" />}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-row gap-x-2">
                            {!isEditing && (
                                <Button
                                    type="button"
                                    color="default"
                                    variant="flat"
                                    size="sm"
                                    onClick={() => doSave(false)}
                                >
                                    {'Save & Close'}
                                </Button>
                            )}
                            <Button
                                type="button"
                                color="primary"
                                size="sm"
                                isLoading={loading}
                                onClick={() => doSave(true)}
                                endContent={!loading && <FontAwesomeIcon icon="fa-solid fa-plus" />}
                            >
                                {isEditing ? 'Save' : 'Save & New'}
                            </Button>
                        </div>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
