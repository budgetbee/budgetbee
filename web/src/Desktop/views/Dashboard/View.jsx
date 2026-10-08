import React, { useState } from "react";
import moment from "moment";

import Layout from "../../layout/Layout";
import Accounts from "./Components/Accounts";
import LastRecords from "./Components/LastRecords";
import BalanceCard from "./Components/BalanceCard";
import TopExpensesCard from "./Components/TopExpensesCard";
import BalanceChart from "./Components/BalanceChart";
import CategoryRecords from "./Components/CategoryRecords";
import CategoryIncomeChart from "./Components/CategoryIncomeChart";
import CategoryExpenseChart from "./Components/CategoryExpenseChart";
import BudgetsOverviewCard from "./Components/BudgetsOverviewCard";
import CategorizerStatusCard from "./Components/CategorizerStatusCard";
import TopNav from "../../layout/TopNav";

const DEFAULT_SEARCH_DATA = {
    from_date: moment().startOf("year").format("YYYY-MM-DD"),
    to_date: moment().format("YYYY-MM-DD"),
};

export default function Dashboard() {
    const [searchData, setSearchData] = useState(DEFAULT_SEARCH_DATA);
    const [lastRecordsRefreshKey, setLastRecordsRefreshKey] = useState(0);

    const handleRecordChange = () => {
        setSearchData((prev) => ({ ...prev, _refresh: Date.now() }));
        setLastRecordsRefreshKey((prev) => prev + 1);
    };

    return (
        <Layout onRecordChange={handleRecordChange}>
            <TopNav searchData={searchData} setSearchData={setSearchData} />

            <div className="flex flex-row min-h-screen">
                <div className="flex flex-col gap-y-6 basis-9/12 px-10 py-5">
                    <div className="flex flex-row gap-x-6">
                        <div className="basis-7/12">
                            <BalanceCard searchData={searchData} />
                        </div>
                        <div className="basis-5/12">
                            <TopExpensesCard searchData={searchData} />
                        </div>
                    </div>

                    <BalanceChart searchData={searchData} />

                    <div className="flex flex-row gap-x-6">
                        <div className="basis-9/12">
                            <CategoryRecords
                                searchData={searchData}
                                onRecordChange={handleRecordChange}
                            />
                        </div>
                        <div className="basis-3/12 flex flex-col gap-y-6">
                            <CategoryIncomeChart searchData={searchData} />
                            <CategoryExpenseChart searchData={searchData} />
                        </div>
                    </div>

                    <div className="flex flex-row gap-x-6">
                        <div className="basis-8/12">
                            <BudgetsOverviewCard />
                        </div>
                        <div className="basis-4/12">
                            <CategorizerStatusCard />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-y-6 basis-3/12 px-10 py-5 sticky top-6 self-start">
                    <Accounts
                        activeAccount={searchData.account_id}
                        setSearchData={setSearchData}
                    />
                    <LastRecords
                        searchData={searchData}
                        refreshKey={lastRecordsRefreshKey}
                    />
                </div>
            </div>
        </Layout>
    );
}
