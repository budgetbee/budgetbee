import React from "react";
import FormModal from "./BudgetFormModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, useDisclosure } from "@nextui-org/react";

export default function BudgetFormButton({ budget, setIsUpdated }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const btn_label = budget ? '' : 'Create';
    const btn_color = budget ? 'default' : 'primary';
    const btn_classes = budget ? 'text-sm w-fit !p-4 min-w-0 min-h-0' : 'w-full py-7 text-lg';
    const btn_icon = budget ? <FontAwesomeIcon icon="fa-solid fa-pen-to-square" /> : <FontAwesomeIcon icon="fa-solid fa-plus" />;

    const modal = (
        <FormModal
            isOpen={true}
            budget={budget}
            onOpenChange={onOpenChange}
            setIsUpdated={setIsUpdated}
        />
    );

    return (
        <>
            {isOpen && modal}
            <Button
                color={btn_color}
                onPress={onOpen}
                className={btn_classes}
                startContent={btn_icon}
            >
                {btn_label}
            </Button>
        </>
    );
}