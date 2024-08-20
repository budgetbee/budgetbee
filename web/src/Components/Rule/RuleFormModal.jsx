import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../Api/Endpoints";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";

export default function RuleFormModal({ isOpen, onOpenChange, rule, updatedCallback }) {
    const [isLoading, setIsLoading] = useState(true);
    const [ruleActionTypes, setRuleActionTypes] = useState([]);
    const [ruleConditionTypes, setRuleConditionTypes] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    const [parentCategory, setParentCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const formRef = useRef();

    useEffect(() => {
        async function getData() {
            setIsLoading(true);
            const actionsData = await Api.getRuleActionTypes();
            const conditionsData = await Api.getRuleConditionTypes();
            const parentCategoriesData = await Api.getParentCategories();
            setRuleActionTypes(actionsData);
            setRuleConditionTypes(conditionsData);
            setParentCategories(parentCategoriesData);
            setIsLoading(false);
        }
        getData();
    }, [isOpen]);

    useEffect(() => {
        async function getParentCategory() {
            setIsLoading(true);
            const categoryData = await Api.getCategory([rule?.actions[0].action]);
            setParentCategory(categoryData.parent_category_id)
            setIsLoading(false);
        }
        if (rule) {
            getParentCategory();
        }
    }, [rule]);

    useEffect(() => {
        async function getCategories() {
            setIsLoading(true);
            const categories = await Api.getCategoriesByParent(parentCategory);
            setCategories(categories);
            setIsLoading(false);
        }
        if (parentCategory) {
            getCategories();
        }
    }, [parentCategory]);

    const title = rule ? 'Edit rule' : 'Create a new rule';

    const handleSaveForm = async (e) => {
        e.preventDefault();

        setIsLoading(true);

        const currentForm = formRef.current;

        if (!currentForm) {
            return;
        }

        const formData = new FormData(formRef.current);
        const formObject = Object.fromEntries(formData.entries());

        if (rule && rule.id) {
            await Api.updateRule(rule.id, formObject);
            updatedCallback();
        }
        else {
            await Api.createRule(formObject);
            updatedCallback()
        }

        onOpenChange();
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        await Api.deleteRule(rule.id);
        updatedCallback();
        setIsLoading(false);
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl">
            <ModalContent className="bg-background">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-white/90">{title}</ModalHeader>
                        <ModalBody>
                            <form onSubmit={handleSaveForm} ref={formRef} id="ruleForm" className="block flex flex-col gap-y-2">
                                <div className="flex flex-row gap-x-4 justify-between">
                                    <Select
                                        className="max-w-xs"
                                        label="Condition"
                                        name="condition_id"
                                        isRequired
                                        defaultSelectedKeys={[rule?.conditions[0].rule_condition_type_id?.toString()]}
                                    >
                                        {ruleConditionTypes.map((conditionType) => (
                                            <SelectItem
                                                key={conditionType.id}
                                                value={conditionType.id}
                                            >
                                                {conditionType.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <Input type="text" label="Condition" name="condition" defaultValue={rule?.conditions[0].condition?.toString()} />
                                </div>
                                <div className="flex flex-row gap-x-4 justify-between">
                                    <Select
                                        className="max-w-xs"
                                        label="Action"
                                        name="action_id"
                                        isRequired
                                        defaultSelectedKeys={[rule?.actions[0].rule_action_type_id?.toString()]}
                                    >
                                        {ruleActionTypes.map((actionType) => (
                                            <SelectItem
                                                key={actionType.id}
                                                value={actionType.id}
                                            >
                                                {actionType.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <Select
                                        className="max-w-xs"
                                        label="Category"
                                        isRequired
                                        selectedKeys={[parentCategory.toString()]}
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
                                        name="action"
                                        isLoading={isLoading}
                                        isRequired
                                        defaultSelectedKeys={[rule?.actions[0].action?.toString()]}
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
                                {rule && (
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
                                    form="ruleForm"
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