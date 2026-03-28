import React, { useEffect, useState } from "react";
import Api from "../../Api/Endpoints";
import UpcomingExpenseCard from "./UpcomingExpenseCard";

export default function UpcomingExpenseList({ forceReload }) {
    const [expenses, setExpenses] = useState([]);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        async function getData() {
            const result = await Api.getAllUpcomingExpenses();
            setExpenses(result.data ?? []);
        }
        getData();
        setReload(false);
    }, [reload, forceReload]);

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <span className="text-lg">No upcoming expenses</span>
                <span className="text-sm mt-1">Create one to start tracking</span>
            </div>
        );
    }

    return (
        <div>
            {expenses.map((expense) => (
                <div key={expense.id}>
                    <UpcomingExpenseCard expense={expense} setReload={setReload} />
                </div>
            ))}
        </div>
    );
}
