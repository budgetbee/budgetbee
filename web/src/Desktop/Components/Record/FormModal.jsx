import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import Api from "../../../Api/Endpoints";
import SelectType from "./SelectType";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Input,
    Button,
    Textarea,
} from "@nextui-org/react";

export default function FormModal({ isOpen, onOpenChange, record_id, fetchAgain, setIsRemoved }) {
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
    const formRef = useRef();

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

    const handleSaveForm = async (e) => {
        e.preventDefault();

        const currentForm = formRef.current;

        if (!currentForm) {
            console.error("Form reference not found");
            return;
        }

        setLoading(true);
        const formData = new FormData(formRef.current);
        const formObject = Object.fromEntries(formData.entries());
        await Api.createRecord(formObject, record_id);

        if (record) {
            fetchAgain();
        }

        setLoading(false);
        onOpenChange();
    };

    const handleDeleteRecord = async () => {
        const userConfirmed = window.confirm("Delete this record?");

        if (userConfirmed) {
            await Api.deleteRecord(record_id);
            onOpenChange();
        }
        setLoading(false);
        setIsRemoved(true);
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="top-center"
            size="xl"
        >
            <ModalContent>
                <form onSubmit={handleSaveForm} ref={formRef} id="recordForm" className="block">
                    <ModalHeader className="flex flex-col gap-1"></ModalHeader>
                    <ModalBody>
                        <>
                            <SelectType onChange={e => setType(e.target.value)} value={type} />
                            <div className="flex flex-row gap-x-3">
                                <Select
                                    isRequired
                                    label="Account"
                                    placeholder="Select account"
                                    name="from_account_id"
                                    className="max-w-xs"
                                    items={accounts}
                                    selectionMode="single"
                                    selectedKeys={fromAccount?.toString()}
                                    onChange={e => setFromAccount(e.target.value)}
                                >
                                    {(item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name}
                                        </SelectItem>
                                    )}
                                </Select>

                                {type === "transfer" && (
                                    <Select
                                        isRequired
                                        label="To account"
                                        placeholder="Select account"
                                        name="to_account_id"
                                        className="max-w-xs"
                                        selectionMode="single"
                                        selectedKeys={toAccount?.toString()}
                                        onChange={e => setToAccount(e.target.value)}
                                    >
                                        {accounts.map((account) => (
                                            <SelectItem
                                                key={account.id}
                                                value={account.id}
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
                                        className="max-w-xs"
                                        label="Category"
                                        name="parent_category_id"
                                        isRequired
                                        selectedKeys={[parentCategory?.toString()]}
                                        onChange={e => setParentCategory(e.target.value)}
                                    >
                                        {parentCategories.map((parent_category) => (
                                            <SelectItem
                                                key={parent_category.id}
                                                value={parent_category.id}
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={parent_category.icon}
                                                        className="text-white rounded-full p-3 flex items-center justify-center"
                                                        style={{
                                                            background:
                                                                parent_category.color,
                                                        }}
                                                    />
                                                }
                                            >
                                                {parent_category.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <Select
                                        className="max-w-xs"
                                        label="Sub category"
                                        name="category_id"
                                        isRequired
                                        selectedKeys={[category?.toString()]}
                                        onChange={e => setCategory(e.target.value)}
                                    >
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={category.id}
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={category.icon}
                                                        className="text-white rounded-full p-3 flex items-center justify-center"
                                                        style={{
                                                            background:
                                                                category.color,
                                                        }}
                                                    />
                                                }
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            )}
                            <Textarea
                                label="Description"
                                name="name"
                                labelPlacement="outside"
                                placeholder="Enter your description"
                                className="w-full"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                            {type === "transfer" && (
                                <Input
                                    isRequired
                                    name="rate"
                                    type="number"
                                    label="Exchange rate"
                                    placeholder=""
                                    className="max-w-xs"
                                    step="any"
                                    defaultValue={record?.rate}
                                />
                            )}
                            <div className="flex flex-row gap-x-3">
                                <Input
                                    isRequired
                                    name="date"
                                    type="date"
                                    label="Date"
                                    placeholder=""
                                    className="max-w-xs"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                                <Input
                                    isRequired
                                    name="amount"
                                    type="number"
                                    label="Amount"
                                    placeholder=""
                                    className="max-w-xs"
                                    step="any"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                        </>
                    </ModalBody>
                    <ModalFooter className="items-center justify-between flex-row-reverse">
                        <Button
                            type="submit"
                            form="recordForm"
                            color="success"
                            isLoading={loading}
                            endContent={
                                !loading && (
                                    <FontAwesomeIcon icon="fa-solid fa-check" />
                                )
                            }
                        >
                            Save
                        </Button>
                        {record && (
                            <Button
                                type="button"
                                color="danger"
                                isLoading={loading}
                                onClick={handleDeleteRecord}
                                endContent={
                                    !loading && (
                                        <FontAwesomeIcon icon="fa-solid fa-trash" />
                                    )
                                }
                            >
                                Delete
                            </Button>
                        )}
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
