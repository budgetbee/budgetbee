import React from "react";
import FormModal from "./BudgetFormModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, useDisclosure } from "@nextui-org/react";

export default function BudgetFormButton({ budget, setIsUpdated }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    let btn_label = budget ? 'Edit' : 'Create';
    let btn_color = budget ? 'default' : 'primary';

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
                startContent={
                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                }
            >
                {btn_label}
            </Button>
        </>
    );
}