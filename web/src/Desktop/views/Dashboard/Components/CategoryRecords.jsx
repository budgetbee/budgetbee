import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { useDisclosure } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import RecordsModal from "../../../Components/Record/RecordsModal";
import DashboardCard from "./DashboardCard";

export default function CategoryRecords({ searchData, onRecordChange }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState([]);
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [expandedItems, setExpandedItems] = useState([]);
    const { isOpen, onOpenChange } = useDisclosure();

    useEffect(() => {
        let cancelled = false;
        async function getBalanceByCategory() {
            const response = await Api.getBalanceByCategory(searchData);
            if (!cancelled) {
                setData(Object.entries(response || {}));
                setIsLoading(false);
            }
        }
        getBalanceByCategory();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    const handleExpand = (parentId) => {
        setExpandedItems((prev) =>
            prev.includes(parentId)
                ? prev.filter((id) => id !== parentId)
                : [...prev, parentId]
        );
    };

    const getRecordsByCategory = async (categoryId) => {
        setLoadingRecords(true);
        const result = await Api.getRecordsByCategory(
            categoryId,
            searchData?.from_date,
            searchData?.to_date
        );
        setLoadingRecords(false);
        if (Array.isArray(result)) {
            setRecords(result);
        }
    };

    const handleShowRecords = (category) => {
        setRecords([]);
        getRecordsByCategory(category);
        onOpenChange(true);
    };

    if (isLoading) {
        return null;
    }

    // The modal is the shared one: the same one the auto-categorisation screen
    // opens when a count is clicked.
    let recordsModal = (
        <RecordsModal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            records={records}
            isLoading={loadingRecords}
            emptyText="No movements in this category."
            onRecordChange={onRecordChange}
        />
    );

    return (
        <DashboardCard
            title="Spending by category"
            icon="fa-solid fa-layer-group"
            tone="amber"
            subtitle="Open a category to see its subcategories"
            className="h-full"
        >
            {isOpen && recordsModal}
            <div className="mt-2 flex flex-col">
                {data.map(([typeKey, type]) => (
                    <div key={typeKey} className="flex flex-col">
                        {Object.entries(type).map(([parentKey, parent]) => {
                            const isExpanded = expandedItems.includes(parent.id);
                            return (
                                <div
                                    key={parentKey}
                                    className="border-t border-white/5 first:border-t-0"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleExpand(parent.id)}
                                        className="flex w-full items-center justify-between gap-3 py-2 text-left"
                                    >
                                        <span className="flex items-center gap-3 min-w-0">
                                            <span
                                                className="flex items-center justify-center w-9 h-9 rounded-2xl text-white shrink-0"
                                                style={{ backgroundColor: parent.color }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={parent.icon}
                                                    className="text-sm"
                                                />
                                            </span>
                                            <span className="text-base font-semibold text-white truncate">
                                                {parent.name}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-3 shrink-0">
                                            <span className="text-base font-bold text-white">
                                                {parent.currency_symbol}{" "}
                                                {numeral(parent.total).format("0,0.00 a")}
                                            </span>
                                            <FontAwesomeIcon
                                                icon={
                                                    isExpanded
                                                        ? "fa-solid fa-chevron-up"
                                                        : "fa-solid fa-chevron-down"
                                                }
                                                className="text-xs text-gray-500"
                                            />
                                        </span>
                                    </button>
                                    {isExpanded && (
                                        <div className="flex flex-col pb-1.5 pl-12">
                                            {Object.entries(parent.childrens).map(
                                                ([childKey, child]) => (
                                                    <button
                                                        key={childKey}
                                                        type="button"
                                                        onClick={() =>
                                                            handleShowRecords(child.id)
                                                        }
                                                        className="flex flex-row items-center justify-between gap-3 border-t border-white/5 py-1.5 text-left"
                                                    >
                                                        <span className="text-[15px] text-gray-300 truncate">
                                                            {child.name}
                                                        </span>
                                                        <span className="text-[15px] font-medium text-gray-200 shrink-0">
                                                            {child.currency_symbol}{" "}
                                                            {numeral(child.total).format(
                                                                "0,0.00 a"
                                                            )}
                                                        </span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
                {data.length === 0 && (
                    <p className="py-3 text-sm text-gray-500">
                        No movements in this period.
                    </p>
                )}
            </div>
        </DashboardCard>
    );
}
