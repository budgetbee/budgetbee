import { useState, useEffect } from "react";
import Api from "../../../Api/Endpoints";

export default function useReportData(searchData) {
    const [data, setData] = useState({
        balance: null,
        topExpenses: [],
        expenseCategories: null,
        incomeCategories: null,
        isLoading: true,
    });

    useEffect(() => {
        let cancelled = false;
        async function fetch() {
            setData((d) => ({ ...d, isLoading: true }));
            const [balance, topExpenses, expenseCats, incomeCats] = await Promise.all([
                Api.getAllBalance(searchData),
                Api.getTopExpenses(searchData),
                Api.getExpenseCategoriesBalance(searchData),
                Api.getIncomeCategoriesBalance(searchData),
            ]);
            if (cancelled) return;
            setData({
                balance,
                topExpenses: Array.isArray(topExpenses) ? topExpenses : [],
                expenseCategories: expenseCats,
                incomeCategories: incomeCats,
                isLoading: false,
            });
        }
        fetch();
        return () => { cancelled = true; };
    }, [searchData]);

    return data;
}
