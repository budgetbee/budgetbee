import React from "react";
import {
    Button,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDisclosure } from "@heroui/react";
import FormModal from "./FormModal";

export default function RecordModalButton() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const modal = (
        <FormModal
            isOpen={true}
            onOpen={onOpen}
            onOpenChange={onOpenChange}
        />
    );

    return (
        <>
            {isOpen && modal}
            <Button
                color="success"
                className="w-full"
                onClick={() => onOpenChange(true)}
                startContent={
                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                }
            >
                New record
            </Button>
        </>
    );
}
