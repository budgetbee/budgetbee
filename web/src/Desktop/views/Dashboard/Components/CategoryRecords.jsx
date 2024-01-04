import React, { useEffect, useState } from "react";
import numeral from "numeral";
import {
    Modal,
    ModalContent,
    ModalBody,
    useDisclosure
} from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../../Api/Endpoints";
import RecordCard from "../../../Components/Record/Card";

export default function CategoryRecords({ searchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [records, setRecords] = useState([]);
    const [expandedItems, setExpandedItems] = useState([]);
    const { isOpen, onOpenChange } = useDisclosure();

    useEffect(() => {
        async function getBalanceByCategory() {
            const data = await Api.getBalanceByCategory(searchData);
            setData(Object.entries(data));
            setIsLoading(false);
        }
        getBalanceByCategory();
    }, [searchData]);

    const handleExpand = (parentId) => {
        if (expandedItems.includes(parentId)) {
            setExpandedItems(expandedItems.filter((id) => id !== parentId));
        } else {
            setExpandedItems([...expandedItems, parentId]);
        }
    };

    const getRecordsByCategory = async (categoryId) => {
        const data = await Api.getRecordsByCategory(categoryId);
        setRecords(data);
    };

    const handleShowRecords = (category) => {
        setRecords([]);
        getRecordsByCategory(category);
        onOpenChange(true);
    };

    if (isLoading) {
        return <></>;
    }

    let recordsModal = (

        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="top-center"
            size="xl"
        >
            <ModalContent>
                <ModalBody className="p-0 bg-black">
                    <div className="max-h-96 overflow-auto w-full bg-black block">
                        <div className="records">
                            {records.map((record) => {
                                return (
                                    <div key={record.id}>
                                        <RecordCard
                                            record={record}
                                            showName={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );

    return (
        <div>
            {isOpen && recordsModal}
            <div className="flex flex-col gap-y-3 p-4 bg-gray-700 rounded-3xl py-4 text-white text-lg">
                <div className="flex flex-row justify-between items-center text-white text-2xl pb-4">
                    <div className="font-bold">Expenses</div>
                </div>
                <div className="flex flex-col divide-y divide-gray-500">
                    {data.map(([key, type]) => {
                        return (
                            <div
                                key={key}
                                className="flex flex-col gap-y-3 py-5 cursor-pointer"
                            >
                                {Object.entries(type).map(
                                    ([keyParent, parent]) => {
                                        const isExpanded =
                                            expandedItems.includes(parent.id);
                                        const inline_style = {
                                            backgroundColor: parent.color,
                                        };
                                        return (
                                            <div key={keyParent}>
                                                <div
                                                    className="flex flex-row justify-between font-bold"
                                                    onClick={() =>
                                                        handleExpand(parent.id)
                                                    }
                                                >
                                                    <div className="flex flex-row items-center gap-x-3">
                                                        <div
                                                            className="m-auto flex items-center justify-center w-9 h-9 rounded-full bg-gray-500"
                                                            style={inline_style}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    parent.icon
                                                                }
                                                            />
                                                        </div>
                                                        <div>{parent.name}</div>
                                                    </div>
                                                    <div>
                                                        {parent.currency_symbol}{" "}
                                                        {numeral(
                                                            parent.total
                                                        ).format("0,0.00 a")}
                                                    </div>
                                                </div>
                                                <div
                                                    id={
                                                        parent.id + "_childrens"
                                                    }
                                                    className={
                                                        "pl-10 flex flex-col divide-y divide-gray-200/20 " +
                                                        (isExpanded
                                                            ? ""
                                                            : "hidden")
                                                    }
                                                >
                                                    {Object.entries(
                                                        parent.childrens
                                                    ).map(
                                                        ([
                                                            keyChildren,
                                                            children,
                                                        ]) => {
                                                            return (
                                                                <div
                                                                    key={
                                                                        key +
                                                                        keyParent +
                                                                        keyChildren
                                                                    }
                                                                    className="flex flex-row justify-between py-2"
                                                                    onClick={() =>
                                                                        handleShowRecords(
                                                                            children.id
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="text-gray-200/50">
                                                                        {
                                                                            children.name
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        {
                                                                            children.currency_symbol
                                                                        }{" "}
                                                                        {numeral(
                                                                            children.total
                                                                        ).format(
                                                                            "0,0.00 a"
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
