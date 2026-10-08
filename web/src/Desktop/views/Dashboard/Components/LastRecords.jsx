import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { useDisclosure } from "@nextui-org/react";
import moment from "moment";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import FormModal from "../../../Components/Record/FormModal";
import DashboardCard from "./DashboardCard";

export default function LastRecords({ searchData, refreshKey, onRecordChange }) {
    const [isLoading, setIsLoading] = useState(true);
    const [recordData, setRecordData] = useState(null);
    const { isOpen, onOpenChange } = useDisclosure();
    const [data, setData] = useState([]);

    useEffect(() => {
        let cancelled = false;
        async function getLastRecords() {
            const requestData = { ...searchData, limit: 5 };
            // The last-records endpoint reads one account at a time; the
            // dashboard filter may hold several, so only a single one is sent.
            if (Array.isArray(requestData.account_id)) {
                if (requestData.account_id.length === 1) {
                    requestData.account_id = requestData.account_id[0];
                } else {
                    delete requestData.account_id;
                }
            }
            const result = await Api.getLastRecords(requestData);
            if (!cancelled) {
                setData(Array.isArray(result) ? result : []);
                setIsLoading(false);
            }
        }
        getLastRecords();
        return () => {
            cancelled = true;
        };
    }, [searchData, refreshKey]);

    if (isLoading) {
        return null;
    }

    const accountId = Array.isArray(searchData.account_id)
        ? searchData.account_id[0] ?? ""
        : searchData.account_id ?? "";

    return (
        <DashboardCard title="Latest movements" icon="fa-solid fa-list" tone="blue">
            {/* El detalle se abre en el modal del movimiento, el mismo que usa
                el resto de la app en escritorio: sin salir del dashboard. */}
            {isOpen && recordData && (
                <FormModal
                    isOpen={true}
                    onOpenChange={onOpenChange}
                    record_id={recordData.id}
                    recordData={recordData}
                    fetchAgain={async (id) => {
                        setRecordData(await Api.getRecordById(id));
                    }}
                    setIsRemoved={() => onRecordChange && onRecordChange()}
                    onRecordChange={onRecordChange}
                />
            )}
            <div className="mt-4 flex flex-col">
                {data.map((record) => {
                    const isIncome = record.amount >= 0;
                    const name =
                        record.name && record.name !== ""
                            ? record.name
                            : record.category_name;
                    const shortName =
                        name && name.length > 22 ? name.slice(0, 22) + "..." : name;
                    return (
                        <button
                            key={record.id}
                            type="button"
                            onClick={() => {
                                setRecordData(record);
                                onOpenChange(true);
                            }}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left border-t border-white/5 first:border-t-0 transition-colors hover:bg-white/5"
                        >
                            <span className="flex items-center gap-3 min-w-0">
                                <span
                                    className="flex items-center justify-center w-9 h-9 rounded-2xl text-white shrink-0"
                                    style={{ backgroundColor: record.category_color }}
                                >
                                    <FontAwesomeIcon
                                        icon={record.icon}
                                        className="text-sm"
                                    />
                                </span>
                                <span className="flex flex-col min-w-0">
                                    <span className="text-sm text-white truncate">
                                        {shortName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {moment(record.date).format("D MMM")}
                                    </span>
                                </span>
                            </span>
                            <span
                                className={`text-sm font-semibold shrink-0 ${
                                    isIncome ? "text-emerald-400" : "text-red-400"
                                }`}
                            >
                                {record.currency_symbol}{" "}
                                {numeral(record.amount).format("0,0.00")}
                            </span>
                        </button>
                    );
                })}
                {data.length === 0 && (
                    <p className="py-3 text-sm text-gray-500">
                        No movements in this period.
                    </p>
                )}
            </div>
            <Link
                to={`/record/list/${accountId}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200"
            >
                View all
                <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
            </Link>
        </DashboardCard>
    );
}
