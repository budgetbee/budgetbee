import React, { useEffect, useState } from "react";
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

export default function FormModal({ isOpen, onOpen, onOpenChange, record_id }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [parentCategorySelect, setParentCategorySelect] = useState(null);
    const [category, setCategory] = useState({ id: 0, name: "" });
    const [record, setRecord] = useState(null);
    const [recordType, setRecordType] = useState("");

    useEffect(() => {
        async function getData() {
            const fetchAccounts = await Api.getAccounts();
            const parentCategories = await Api.getParentCategories();
            setAccounts(fetchAccounts);
            setParentCategories(parentCategories);
            if (record_id !== undefined) {
                const record = await Api.getRecordById(record_id);
                setRecord(record);
                setCategory({
                    id: record.category_id,
                    name: record.category_name,
                });
                setParentCategorySelect(record.parent_category_id);
                setRecordType(record.type);
            }
        }
        getData();
    }, [isOpen]);

    useEffect(() => {
        async function getCategories() {
            const categories = await Api.getCategoriesByParent(
                parentCategorySelect
            );
            setCategories(categories);
        }
        if (parentCategorySelect) {
            getCategories();
        }
    }, [parentCategorySelect]);

    const handleOpenCategory = () => {
        setParentCategorySelect(true);
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
        setLoading(true);
        const formData = new FormData(document.querySelector("form"));
        const formObject = Object.fromEntries(formData.entries());
        const response = await Api.createRecord(formObject, record_id);

        if (response.error) {
            setErrorMsg(response.error);
        }

        setLoading(false);
        onOpenChange();
    };

    const handleDeleteRecord = async () => {
        const userConfirmed = window.confirm("Delete this record?");

        if (userConfirmed) {
            await Api.deleteRecord(record_id);
            window.location.href = "/";
        }
    };

    const handleChangeType = (e) => {
        setRecordType(e.target.value);
    };

    const handleParentCategorySelectionChange = (e) => {
        setParentCategorySelect(e.target.value);
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="top-center"
            size="xl"
        >
            <ModalContent>
                <form onSubmit={handleSaveForm} className="block">
                    <ModalHeader className="flex flex-col gap-1"></ModalHeader>
                    <ModalBody>
                        {record && (
                            <>
                                <SelectType onChange={handleChangeType} defaultValue={record.type} />
                                <div className="flex flex-row gap-x-3">
                                    <Select
                                        isRequired
                                        label="Account"
                                        placeholder="Select account"
                                        name="from_account_id"
                                        className="max-w-xs"
                                        items={accounts}
                                        selectionMode="single"
                                        defaultSelectedKeys={[record.from_account_id.toString()]}
                                    >
                                        {(item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name}
                                            </SelectItem>
                                        )}
                                    </Select>

                                    {recordType === "transfer" && (
                                        <Select
                                            isRequired
                                            label="To account"
                                            placeholder="Select account"
                                            name="to_account_id"
                                            className="max-w-xs"
                                            selectionMode="single"
                                            defaultSelectedKeys={record.to_account_id ? [record.to_account_id.toString()] : []}
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
                                {recordType !== "transfer" && (
                                    <div className="flex flex-row gap-x-3">
                                        <Select
                                            className="max-w-xs"
                                            label="Category"
                                            name="parent_category_id"
                                            isRequired
                                            onChange={
                                                handleParentCategorySelectionChange
                                            }
                                            defaultSelectedKeys={[record?.parent_category_id.toString()]}
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
                                            defaultSelectedKeys={[record?.category_id.toString()]}
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
                                    defaultValue={record?.name}
                                />
                                {recordType === "transfer" &&
                                    record.from_account_id &&
                                    record.to_account_id &&
                                    (record.from_account_id !== record.to_account_id) && (
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
                                        defaultValue={moment(record.date).format("YYYY-MM-DD")}
                                    />
                                    <Input
                                        isRequired
                                        name="amount"
                                        type="number"
                                        label="Amount"
                                        placeholder=""
                                        className="max-w-xs"
                                        step="any"
                                        defaultValue={record?.amount}
                                    />
                                </div>
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter className="items-center">
                        <Button
                            type="submit"
                            color="success"
                            isLoading={loading}
                            endContent={
                                !loading && (
                                    <FontAwesomeIcon icon="fa-solid fa-check" />
                                )
                            }
                        >
                            Save
                        </Button></ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
