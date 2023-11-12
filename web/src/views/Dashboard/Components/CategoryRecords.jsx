import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../Api/Endpoints";
import RecordCard from "../../../Components/Record/Card";
import DatesSelect from "../../../Components/Miscellaneous/DatesSelect";

export default function CategoryRecords({ activeAccount }) {
    const [isLoading, setIsLoading] = useState(true);
    const [showRecords, setShowRecords] = useState(false);
    const [data, setData] = useState([]);
    const [records, setRecords] = useState([]);
    const [expandedItems, setExpandedItems] = useState([]);
    const [fromDate, setFromDate] = useState(null);

    useEffect(() => {
        async function getBalanceByCategory() {
            const data = await Api.getBalanceByCategory({
                account_id: activeAccount,
                from_date: fromDate,
            });
            if (data && Object.entries(data)){
                setData(Object.entries(data));
            }
            setIsLoading(false);
        }
        getBalanceByCategory();
    }, [activeAccount, fromDate]);

    const handleExpand = (parentId) => {
        if (expandedItems.includes(parentId)) {
            setExpandedItems(expandedItems.filter((id) => id !== parentId));
        } else {
            setExpandedItems([...expandedItems, parentId]);
        }
    };

    const getRecordsByCategory = async (categoryId) => {
        const data = await Api.getRecordsByCategory(categoryId, fromDate);
        if (data){
            setRecords(data);
        }
    };

    const handleHideRecords = () => {
        setShowRecords(false);
        setRecords([]);
    };

    const handleShowRecords = (category) => {
        getRecordsByCategory(category);
        setShowRecords(true);
    };

    if (isLoading) {
        return <></>;
    }

    let recordsModal = <></>;
    if (showRecords && records.length > 0) {
        recordsModal = (
            <div
                className="fixed inset-0 flex flex-col items-center justify-center bg-black/50"
                onClick={handleHideRecords}
            >
                <div className="w-11/12 bg-gray-900 text-white rounded">
                    <div className="px-5 py-3 text-xl">Records</div>
                    <div className="max-h-96 overflow-auto w-full bg-black block">
                        <div className="records">
                            {records.map((record, index) => {
                                return (
                                    <div key={index}>
                                        <RecordCard
                                            record={record}
                                            showName={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {showRecords && recordsModal}
            <div className="flex flex-col gap-y-3 p-4 bg-gray-700 rounded py-4 text-white text-lg">
                <div className="flex flex-row justify-between items-center text-white text-2xl pb-4">
                    <div className="font-bold">Expenses</div>
                    <div>
                        <DatesSelect setDates={setFromDate} />
                    </div>
                </div>
                <div className="flex flex-col divide-y divide-gray-500">
                    {data.map(([key, type]) => {
                        return (
                            <div
                                key={key}
                                className="flex flex-col gap-y-3 py-5"
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
                                                    {parent.currency_symbol} {numeral(
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
                                                                    {children.currency_symbol} {numeral(
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
