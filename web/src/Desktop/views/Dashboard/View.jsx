import React, { useState } from "react";
import Layout from "../../layout/Layout";

import Accounts from "./Components/Accounts";
import LastRecords from "./Components/LastRecords";
import BalanceChart from "./Components/BalanceChart";
import CategoryRecords from "./Components/CategoryRecords";
import CategoryChart from "./Components/CategoryChart";
// import TopNav from "../../layout/TopNav";

export default function Dashboard() {
    const [activeAccount, setActiveAccount] = useState(null);

    return (
        <Layout>
            {/* <TopNav menu={true} /> */}
            <div className="flex flex-col gap-y-4 bg-black px-3 py-5 mt-14 pt-4">
                <div>
                    <Accounts
                        activeAccount={activeAccount}
                        setActiveAccount={setActiveAccount}
                    />
                </div>
                <div>
                    <BalanceChart activeAccount={activeAccount} />
                </div>
                <div>
                    <CategoryChart activeAccount={activeAccount} />
                </div>
                <div>
                    <CategoryRecords activeAccount={activeAccount} />
                </div>
                <div>
                    <LastRecords activeAccount={activeAccount} />
                </div>
            </div>
        </Layout>
    );
}
