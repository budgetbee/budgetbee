import React, { useState } from "react";

import Accounts from "./Components/Accounts";
import LastRecords from "./Components/LastRecords";
import BalanceChart from "./Components/BalanceChart";
import CategoryRecords from "./Components/CategoryRecords";
import CategoryChart from "./Components/CategoryChart";
import TopNav from "../../layout/TopNav";
import FloatMenu from "../../layout/FloatMenu";

export default function Dashboard() {
    const [activeAccount, setActiveAccount] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div>
            <TopNav menu={true} />
            <div className="flex flex-col gap-y-4 bg-black px-3 py-5 mt-14 pt-4">
                <FloatMenu />
                <div>
                    <Accounts
                        activeAccount={activeAccount}
                        setActiveAccount={setActiveAccount}
                        onRefresh={handleRefresh}
                    />
                </div>
                <div>
                    <BalanceChart activeAccount={activeAccount} refreshKey={refreshKey} />
                </div>
                <div>
                    <CategoryChart activeAccount={activeAccount} refreshKey={refreshKey} />
                </div>
                <div>
                    <CategoryRecords activeAccount={activeAccount} refreshKey={refreshKey} />
                </div>
                <div>
                    <LastRecords activeAccount={activeAccount} refreshKey={refreshKey} />
                </div>
            </div>
        </div>
    );
}
