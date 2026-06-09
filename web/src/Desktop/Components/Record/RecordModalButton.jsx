import React from "react";
import { useTranslation } from "react-i18next";
import {
    Button,
} from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDisclosure } from "@nextui-org/react";
import FormModal from "./FormModal";

export default function RecordModalButton({ onRecordChange }) {
    const { t } = useTranslation();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const modal = (
        <FormModal
            isOpen={true}
            onOpen={onOpen}
            onOpenChange={onOpenChange}
            onRecordChange={onRecordChange}
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
                {t('record.newRecord')}
            </Button>
        </>
    );
}
