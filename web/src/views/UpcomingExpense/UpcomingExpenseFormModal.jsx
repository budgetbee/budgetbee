import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../Api/Endpoints";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
} from "@nextui-org/react";
import { useTranslation } from "react-i18next";

export default function UpcomingExpenseFormModal({
    isOpen,
    onOpenChange,
    expense,
    setIsUpdated,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);
    const [parentCategory, setParentCategory] = useState(
        expense?.parent_category_id?.toString()
    );
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState(expense?.category_id?.toString());
    const [title, setTitle] = useState(expense?.title ?? "");
    const [amount, setAmount] = useState(expense?.amount ?? "");
    const [dueDate, setDueDate] = useState(expense?.due_date ?? "");
    const formRef = useRef();
    const { t } = useTranslation();

    useEffect(() => {
        async function getData() {
            setIsLoading(true);
            const data = await Api.getParentCategories();
            setParentCategories(data);
            setIsLoading(false);
        }
        getData();
    }, [isOpen]);

    useEffect(() => {
        async function getCategories() {
            setIsLoading(true);
            const data = await Api.getCategoriesByParent(parentCategory);
            setCategories(data);
            setIsLoading(false);
        }
        if (parentCategory) {
            getCategories();
        }
    }, [parentCategory]);

    const modalTitle = expense ? t("upcomingExpenses.edit") : t("upcomingExpenses.new");

    const handleSaveForm = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(formRef.current);
        const formObject = Object.fromEntries(formData.entries());

        if (expense && expense.id) {
            await Api.updateUpcomingExpense(formObject, expense.id);
        } else {
            await Api.createUpcomingExpense(formObject);
        }

        setIsUpdated(true);
        onOpenChange();
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        await Api.deleteUpcomingExpense(expense.id);
        setIsUpdated(true);
        setIsLoading(false);
        onOpenChange();
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            className="w-11/12"
            placement="center"
        >
            <ModalContent className="bg-background">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-white/90">
                            {modalTitle}
                        </ModalHeader>
                        <ModalBody>
                            <form
                                onSubmit={handleSaveForm}
                                ref={formRef}
                                id="upcomingExpenseForm"
                                className="flex flex-col gap-y-3"
                            >
                                <Input
                                    name="title"
                                    type="text"
                                    label={t("upcomingExpenses.title")}
                                    isRequired
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                <Input
                                    name="amount"
                                    type="number"
                                    step="any"
                                    label={t("upcomingExpenses.amount")}
                                    isRequired
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <Input
                                    name="due_date"
                                    type="date"
                                    label={t("upcomingExpenses.dueDate")}
                                    isRequired
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                                <div className="flex flex-row gap-x-3">
                                    <Select
                                        className="max-w-xs"
                                        label={t("upcomingExpenses.category")}
                                        name="parent_category_id"
                                        isRequired
                                        selectedKeys={
                                            parentCategory
                                                ? [parentCategory]
                                                : []
                                        }
                                        onChange={(e) =>
                                            setParentCategory(e.target.value)
                                        }
                                    >
                                        {parentCategories.map((pc) => (
                                            <SelectItem
                                                key={pc.id}
                                                value={pc.id}
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={pc.icon}
                                                        className="text-white rounded-full p-3 flex items-center justify-center"
                                                        style={{
                                                            background: pc.color,
                                                        }}
                                                    />
                                                }
                                            >
                                                {pc.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <Select
                                        className="max-w-xs"
                                        label={t("upcomingExpenses.subCategory")}
                                        name="category_id"
                                        isRequired
                                        selectedKeys={
                                            category ? [category] : []
                                        }
                                        onChange={(e) =>
                                            setCategory(e.target.value)
                                        }
                                    >
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id}
                                                startContent={
                                                    <FontAwesomeIcon
                                                        icon={cat.icon}
                                                        className="text-white rounded-full p-3 flex items-center justify-center"
                                                        style={{
                                                            background:
                                                                cat.color,
                                                        }}
                                                    />
                                                }
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </form>
                        </ModalBody>
                        <ModalFooter>
                            <div className="flex flex-row gap-x-3">
                                {expense && (
                                    <Button
                                        color="danger"
                                        type="button"
                                        onClick={handleDelete}
                                        isLoading={isLoading}
                                        startContent={
                                            !isLoading && (
                                                <FontAwesomeIcon icon="fa-solid fa-trash" />
                                            )
                                        }
                                    >
                                        {t("common.delete")}
                                    </Button>
                                )}
                                <Button
                                    color="success"
                                    type="submit"
                                    form="upcomingExpenseForm"
                                    isLoading={isLoading}
                                    startContent={
                                        !isLoading && (
                                            <FontAwesomeIcon icon="fa-solid fa-check" />
                                        )
                                    }
                                >
                                    {t("common.save")}
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
