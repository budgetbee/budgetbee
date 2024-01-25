import React, { useState } from "react";
import Layout from "../../layout/Layout";
import BudgetFormButton from "./BudgetFormButton";
import BudgetList from "./BudgetList";

export default function BudgetDashboard() {
    const [isUpdated, setIsUpdated] = useState(false);

    return (
        <Layout>
            <div className="px-5 mt-10">
                <div className="mb-4">
                    <BudgetFormButton setIsUpdated={setIsUpdated} />
                </div>
                <BudgetList forceReload={isUpdated} />
            </div>
        </Layout>
    )
}