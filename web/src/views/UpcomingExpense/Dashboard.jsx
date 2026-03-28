import React, { useState } from "react";
import Layout from "../../layout/Layout";
import UpcomingExpenseFormButton from "./UpcomingExpenseFormButton";
import UpcomingExpenseList from "./UpcomingExpenseList";

export default function UpcomingExpenseDashboard() {
    const [isUpdated, setIsUpdated] = useState(false);

    return (
        <Layout>
            <div className="pt-16 min-h-screen bg-background">
                <div className="px-5 mb-4 mt-2">
                    <UpcomingExpenseFormButton setIsUpdated={setIsUpdated} />
                </div>
                <UpcomingExpenseList forceReload={isUpdated} />
            </div>
        </Layout>
    );
}
