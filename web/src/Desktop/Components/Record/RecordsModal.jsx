import React from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/react";

import RecordCard from "./Card";

/**
 * A scrolling list of movement cards inside a modal.
 *
 * This is the modal the dashboard opens when a category is clicked, pulled out
 * into a component of its own so the auto-categorisation screen can open any
 * count with the same look: "27 movements" on a rule, or "5 movements
 * categorised like this" on a suggestion.
 *
 * It only paints what it is given: the screen that opens it fetches the
 * movements.
 */
export default function RecordsModal({
    isOpen,
    onOpenChange,
    records = [],
    isLoading = false,
    title = null,
    emptyText = "No movements here.",
    onRecordChange = null,
}) {
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center" size="xl">
            <ModalContent>
                <ModalBody className="p-0 bg-black">
                    {title ? (
                        <div className="text-white text-sm font-medium px-4 pt-4 pb-2">{title}</div>
                    ) : null}

                    {isLoading ? (
                        <div className="text-gray-500 text-sm px-4 py-6 text-center">Loading…</div>
                    ) : records.length === 0 ? (
                        <div className="text-gray-500 text-sm px-4 py-6 text-center">{emptyText}</div>
                    ) : (
                        <div className="max-h-96 overflow-auto w-full bg-black block">
                            <div className="records">
                                {records.map((record) => (
                                    <div key={record.id}>
                                        <RecordCard
                                            record={record}
                                            showName={true}
                                            onRecordChange={onRecordChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
