import React from "react";
import FormModal from "./BudgetFormModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, useDisclosure } from "@nextui-org/react";

export default function BudgetFormButton({ budget, setIsUpdated }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    let btnLabel = budget ? 'Edit' : 'Create';

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
                onPress={onOpen}
                startContent={
                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                }
            >
                {btnLabel}
            </Button>
        </>
    );
}