import React, { useState } from "react";
import Layout from "../../layout/Layout";
import UpcomingExpenseFormButton from "../../../views/UpcomingExpense/UpcomingExpenseFormButton";
import UpcomingExpenseList from "../../../views/UpcomingExpense/UpcomingExpenseList";

export default function UpcomingExpenseDashboard() {
    const [isUpdated, setIsUpdated] = useState(false);

    return (
        <Layout>
            <div className="px-5 mt-10">
                <div className="mb-4">
                    <UpcomingExpenseFormButton setIsUpdated={setIsUpdated} />
                </div>
                <UpcomingExpenseList forceReload={isUpdated} />
            </div>
        </Layout>
    );
}
