import React, { useState } from "react";
import Layout from "../../layout/Layout";
import BudgetFormButton from "./BudgetFormButton";
import BudgetList from "./BudgetList";

export default function BudgetDashboard() {
    const [isUpdated, setIsUpdated] = useState(false);

    return (
        <Layout>
            <BudgetFormButton setIsUpdated={setIsUpdated} />
            <BudgetList forceReload={isUpdated} />
        </Layout>
    )
}