import React from "react";
import FormModal from "./RuleFormModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, useDisclosure } from "@nextui-org/react";

export default function RuleFormButton({ rule, updatedCallback }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    let btn_label = rule ? 'Edit' : 'Create';
    let btn_color = rule ? 'default' : 'primary';

    const modal = (
        <FormModal
            isOpen={true}
            rule={rule}
            onOpenChange={onOpenChange}
            updatedCallback={updatedCallback}
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