import React, { useState } from "react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Layout from "../../layout/Layout";
import ReportsFilterBar from "../../../views/Reports/Components/ReportsFilterBar";
import SummaryCards from "../../../views/Reports/Components/SummaryCards";
import TimelinePanel from "../../../views/Reports/Components/TimelinePanel";
import ExpenseCategoryPanel from "../../../views/Reports/Components/ExpenseCategoryPanel";
import IncomeCategoryPanel from "../../../views/Reports/Components/IncomeCategoryPanel";
import TopExpensesPanel from "../../../views/Reports/Components/TopExpensesPanel";

export default function ReportsDashboard() {
    const [searchData, setSearchData] = useState({
        from_date: moment().startOf("month").format("YYYY-MM-DD"),
        to_date: moment().format("YYYY-MM-DD"),
    });

    return (
        <Layout>
            <div className="flex flex-col gap-y-6 px-10 py-6 min-h-screen">
                {/* Page header */}
                <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center gap-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-purple-600/30">
                            <FontAwesomeIcon
                                icon="fa-solid fa-chart-pie"
                                className="text-purple-400 text-lg"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
                            <p className="text-sm text-gray-400">Track your income and expenses over time</p>
                        </div>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="p-5 bg-gray-700 rounded-3xl">
                    <ReportsFilterBar searchData={searchData} setSearchData={setSearchData} />
                </div>

                {/* Summary cards */}
                <SummaryCards searchData={searchData} />

                {/* Balance timeline */}
                <TimelinePanel searchData={searchData} />

                {/* Top expenses */}
                <TopExpensesPanel searchData={searchData} />

                {/* Category breakdowns */}
                <div className="grid grid-cols-2 gap-6">
                    <ExpenseCategoryPanel searchData={searchData} />
                    <IncomeCategoryPanel searchData={searchData} />
                </div>
            </div>
        </Layout>
    );
}
