import React, { useState } from "react";
import moment from "moment";

import Layout from "../../layout/Layout";
import Accounts from "./Components/Accounts";
import LastRecords from "./Components/LastRecords";
import BalanceCard from "./Components/BalanceCard";
import IncomeExpensesBalanceCard from "./Components/IncomeExpensesBalanceCard";
import TopExpensesCard from "./Components/TopExpensesCard";
import BalanceChart from "./Components/BalanceChart";
import CategoryRecords from "./Components/CategoryRecords";
import CategoryIncomeChart from "./Components/CategoryIncomeChart";
import CategoryExpenseChart from "./Components/CategoryExpenseChart";
import TopNav from "../../layout/TopNav";

export default function Dashboard() {
    const [searchData, setSearchData] = useState({
        from_date: moment().startOf("year").format("YYYY-MM-DD"),
        to_date: moment().format("YYYY-MM-DD"),
    });

    return (
        <Layout>
            <TopNav setSearchData={setSearchData} />
            <div className="flex flex-row min-h-screen">
                <div className="flex flex-col gap-y-10 basis-9/12 px-10 py-5">
                    <div className="flex flex-row gap-x-10">
                        <div className="basis-2/12">
                            <BalanceCard searchData={searchData} />
                        </div>
                        <div className="basis-4/12">
                            <IncomeExpensesBalanceCard
                                searchData={searchData}
                            />
                        </div>
                        <div className="grow">
                            <TopExpensesCard searchData={searchData} />
                        </div>
                    </div>
                    <BalanceChart searchData={searchData} />
                    <div className="flex flex-row gap-x-10">
                        <div className="basis-10/12">
                            <CategoryRecords searchData={searchData} />
                        </div>
                        <div className="basis-2/12 flex flex-col gap-y-10">
                            <CategoryIncomeChart searchData={searchData} />
                            <CategoryExpenseChart searchData={searchData} />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-y-5 basis-3/12 px-10 py-5">
                    <Accounts
                        activeAccount={searchData.account_id}
                        setSearchData={setSearchData}
                    />
                    <LastRecords searchData={searchData} />
                </div>
            </div>
        </Layout>
    );
}
