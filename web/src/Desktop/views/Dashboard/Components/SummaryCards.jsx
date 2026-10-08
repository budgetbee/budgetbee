import React, { useEffect, useState } from "react";
import numeral from "numeral";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";

/**
 * Income, expenses and net for the current period, each compared against the
 * same length of time right before it. Every number comes from the balance
 * endpoint: the previous window is the same range shifted back, so nothing is
 * estimated on the client.
 */
function previousRange(searchData) {
    const from = moment(searchData?.from_date);
    const to = moment(searchData?.to_date);
    const days = Math.max(1, to.diff(from, "days") + 1);
    const previousTo = from.clone().subtract(1, "day");
    const previousFrom = previousTo.clone().subtract(days - 1, "days");
    return {
        from_date: previousFrom.format("YYYY-MM-DD"),
        to_date: previousTo.format("YYYY-MM-DD"),
    };
}

function percentChange(value, previous, magnitude) {
    const current = magnitude ? Math.abs(value || 0) : value || 0;
    const before = magnitude ? Math.abs(previous || 0) : previous || 0;
    if (!before) {
        return null;
    }
    return ((current - before) / Math.abs(before)) * 100;
}

const TONES = {
    emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
    amber: "bg-amber-500/15 border-amber-500/25 text-amber-300",
    blue: "bg-blue-500/15 border-blue-500/25 text-blue-300",
};

function Delta({ change, goodWhenUp }) {
    if (change === null) {
        return <span className="text-xs text-gray-500">No previous data</span>;
    }
    const isUp = change >= 0;
    const isGood = goodWhenUp ? isUp : !isUp;
    return (
        <span className="flex items-center gap-1.5 text-xs">
            <span className={isGood ? "text-emerald-400" : "text-red-400"}>
                <FontAwesomeIcon
                    icon={isUp ? "fa-solid fa-arrow-up" : "fa-solid fa-arrow-down"}
                />
                {" "}
                {numeral(Math.abs(change)).format("0,0.0")}%
            </span>
            <span className="text-gray-500">vs previous period</span>
        </span>
    );
}

export default function SummaryCards({ searchData }) {
    const [current, setCurrent] = useState(null);
    const [previous, setPrevious] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const range = previousRange(searchData);
            const [now, before] = await Promise.all([
                Api.getAllBalance(searchData),
                Api.getAllBalance({ ...searchData, ...range }),
            ]);
            if (cancelled) {
                return;
            }
            setCurrent(now && !now.error ? now : null);
            setPrevious(before);
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [searchData]);

    if (!current) {
        return null;
    }

    const symbol = current.currency_symbol || "";
    const before = previous && !previous.error ? previous : {};
    const net = (current.incomes || 0) + (current.expenses || 0);
    const previousNet = (before.incomes || 0) + (before.expenses || 0);

    const metrics = [
        {
            key: "income",
            label: "Income",
            icon: "fa-solid fa-arrow-trend-up",
            tone: "emerald",
            display: Math.abs(current.incomes || 0),
            change: percentChange(current.incomes, before.incomes, false),
            goodWhenUp: true,
        },
        {
            key: "expenses",
            label: "Expenses",
            icon: "fa-solid fa-arrow-trend-down",
            tone: "amber",
            display: Math.abs(current.expenses || 0),
            change: percentChange(current.expenses, before.expenses, true),
            goodWhenUp: false,
        },
        {
            key: "net",
            label: "Net",
            icon: "fa-solid fa-scale-balanced",
            tone: "blue",
            display: net,
            change: percentChange(net, previousNet, false),
            goodWhenUp: true,
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-x-6">
            {metrics.map((metric) => (
                <div
                    key={metric.key}
                    className="rounded-2xl border border-gray-700 bg-[#2c3a50] p-4 sm:p-5"
                >
                    <div className="flex items-center gap-3">
                        <span
                            className={`flex items-center justify-center w-9 h-9 rounded-2xl border text-sm shrink-0 ${TONES[metric.tone]}`}
                        >
                            <FontAwesomeIcon icon={metric.icon} />
                        </span>
                        <span className="text-sm text-gray-400">{metric.label}</span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                        {symbol} {numeral(metric.display).format("0,0.00")}
                    </div>
                    <div className="mt-1">
                        <Delta change={metric.change} goodWhenUp={metric.goodWhenUp} />
                    </div>
                </div>
            ))}
        </div>
    );
}
