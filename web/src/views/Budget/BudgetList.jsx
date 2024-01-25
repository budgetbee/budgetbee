import React, { useEffect, useState } from "react";
import Api from "../../Api/Endpoints";
import BudgetCard from "./BudgetCard";

export default function BudgetList({ forceReload }) {
    const [budgets, setBudgets] = useState([]);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        async function getData() {
            const budgets = await Api.getAllBudgets();
            setBudgets(budgets.data);
        }
        getData();
        setReload(false);
    }, [reload, forceReload]);

    return (
        <div>
            {budgets.map((budget) => {
                return (
                    <div key={budget.id}>
                        <BudgetCard budget={budget} setReload={setReload} />
                    </div>
                )
            })}
        </div>
    );

}