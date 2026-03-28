import React from "react";
import FormModal from "./UpcomingExpenseFormModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, useDisclosure } from "@nextui-org/react";

export default function UpcomingExpenseFormButton({ expense, setIsUpdated }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const btn_label = expense ? "" : "Create";
    const btn_color = expense ? "default" : "primary";
    const btn_classes = expense
        ? "text-sm w-fit !p-4 min-w-0 min-h-0"
        : "w-full py-7 text-2xl";
    const btn_icon = expense ? (
        <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
    ) : (
        <FontAwesomeIcon icon="fa-solid fa-plus" />
    );

    return (
        <>
            {isOpen && (
                <FormModal
                    isOpen={true}
                    expense={expense}
                    onOpenChange={onOpenChange}
                    setIsUpdated={setIsUpdated}
                />
            )}
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
