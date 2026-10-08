import React, { useEffect, useState } from "react";
import numeral from "numeral";
import moment from "moment";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

export default function LastRecords({ searchData, refreshKey }) {
    const [isLoading, setIsLoading] = useState(true);
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
            <div className="mt-4 flex flex-col">
                {data.map((record) => {
                    const isIncome = record.amount >= 0;
                    const name =
                        record.name && record.name !== ""
                            ? record.name
                            : record.category_name;
                    const shortName =
                        name && name.length > 22 ? name.slice(0, 22) + "..." : name;
                    // Sin enlace: apuntaba al formulario de movimiento
                    // (/record/id), que en esta app esta oculto, asi que la
                    // pulsacion llevaba a una pantalla que no debe abrirse.
                    return (
                        <div
                            key={record.id}
                            className="flex items-center justify-between gap-3 py-3 border-t border-white/5 first:border-t-0"
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
                        </div>
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
