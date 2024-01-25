import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";

export default function BudgetFormModal({ isOpen, onOpenChange, budget, setIsUpdated }) {
    const [isLoading, setIsLoading] = useState(true);
    const [parentCategories, setParentCategories] = useState([]);
    const [parentCategory, setParentCategory] = useState(budget?.parent_category_id);
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState(budget?.category_id);
    const [amount, setAmount] = useState(budget?.amount);
    const formRef = useRef();

    useEffect(() => {
        async function getData() {
            setIsLoading(true);
            const parentCategories = await Api.getParentCategories();
            setParentCategories(parentCategories);
            setIsLoading(false);
        }
        getData();
    }, [isOpen]);

    useEffect(() => {
        async function getCategories() {
            setIsLoading(true);
            const categories = await Api.getCategoriesByParent(
                parentCategory
            );
            setCategories(categories);
            setIsLoading(false);
        }
        if (parentCategory) {
            getCategories();
        }
    }, [parentCategory]);

    let title = 'Create a new budget';

    const handleSaveForm = async (e) => {
        e.preventDefault();

        setIsLoading(true);

        const currentForm = formRef.current;

        if (!currentForm) {
            console.error("Form reference not found");
            return;
        }

        const formData = new FormData(formRef.current);
        const formObject = Object.fromEntries(formData.entries());

        if (budget && budget.id) {
            await Api.updateBudget(formObject, budget.id);
            setIsUpdated(true);
        }
        else {
            await Api.createBudget(formObject);
            setIsUpdated(true)
        }

        onOpenChange();
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        await Api.deleteBudget(budget.id);
        setIsUpdated(true);
        setIsLoading(false);
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent className="bg-background">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-white/90">{title}</ModalHeader>
                        <ModalBody>
                            <form onSubmit={handleSaveForm} ref={formRef} id="budgetForm" className="block flex flex-col gap-y-2">
                                <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                                    <Input name="amount" type="number" step="any" label="Amount/Month" color="secundary" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                                <div className="flex flex-row gap-x-3">
                                    <Select
                                        className="max-w-xs"
                                        label="Category"
                                        name="parent_category_id"
                                        isRequired
                                        selectedKeys={[parentCategory?.toString()]}
                                        onChange={(e) => setParentCategory(e.target.value)}
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
                                        onChange={(e) => setCategory(e.target.value)}
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
                            </form>
                        </ModalBody>
                        <ModalFooter>
                            <div className="flex flex-row gap-x-3">
                                {budget && (
                                    <Button
                                        color="danger"
                                        type="button"
                                        onClick={handleDelete}
                                        isLoading={isLoading}
                                        startContent={!isLoading && <FontAwesomeIcon icon="fa-solid fa-trash" />}>
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    color="success"
                                    type="submit"
                                    form="budgetForm"
                                    isLoading={isLoading}
                                    startContent={!isLoading && <FontAwesomeIcon icon="fa-solid fa-check" />}
                                    >
                                    Save
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal >
    )
}