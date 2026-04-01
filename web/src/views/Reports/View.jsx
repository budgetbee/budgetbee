import React, { useState } from "react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import TopNav from "../../layout/TopNav";
import FloatMenu from "../../layout/FloatMenu";
import ReportsFilterBar from "./Components/ReportsFilterBar";
import SummaryCards from "./Components/SummaryCards";
import TimelinePanel from "./Components/TimelinePanel";
import ExpenseCategoryPanel from "./Components/ExpenseCategoryPanel";
import IncomeCategoryPanel from "./Components/IncomeCategoryPanel";
import TopExpensesPanel from "./Components/TopExpensesPanel";

export default function ReportsDashboard() {
    const [searchData, setSearchData] = useState({
        from_date: moment().startOf("month").format("YYYY-MM-DD"),
        to_date: moment().format("YYYY-MM-DD"),
    });

    return (
        <div>
            <TopNav menu={true} />
            <div className="flex flex-col gap-y-4 bg-black px-3 py-5 mt-14 pt-4">
                <FloatMenu />

                {/* Page title */}
                <div className="flex flex-row items-center gap-x-2 px-1">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600/30">
                        <FontAwesomeIcon icon="fa-solid fa-chart-pie" className="text-purple-400" />
                    </div>
                    <h1 className="text-white text-xl font-bold">Financial Reports</h1>
                </div>

                {/* Filter bar */}
                <div className="p-4 bg-gray-800 rounded-2xl overflow-x-auto">
                    <ReportsFilterBar searchData={searchData} setSearchData={setSearchData} />
                </div>

                {/* Summary cards */}
                <SummaryCards searchData={searchData} />

                {/* Balance over time */}
                <TimelinePanel searchData={searchData} />

                {/* Top expenses */}
                <TopExpensesPanel searchData={searchData} />

                {/* Expense categories */}
                <ExpenseCategoryPanel searchData={searchData} />

                {/* Income categories */}
                <IncomeCategoryPanel searchData={searchData} />
            </div>
        </div>
    );
}
