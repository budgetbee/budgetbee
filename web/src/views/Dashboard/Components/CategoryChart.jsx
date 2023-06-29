import React, { useEffect, useState } from "react";
import numeral from "numeral";
import "numeral/locales/es";

import Api from "../../../Api/Endpoints";
import DoughnutChart from "../../../Components/Chart/DoughnutChart";
import DatesSelect from "../../../Components/Miscellaneous/DatesSelect";

export default function CategoryChart({ activeAccount }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [parentCategories, setParentCategories] = useState(null);
    const [expensesBalance, setExpensesBalance] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [parentCategory, setParentCategory] = useState(null);

    numeral.locale("es");

    useEffect(() => {
        async function getCategoriesBalance() {
            const parentCategories = await Api.getCategoriesBalance(activeAccount, fromDate);
            const balance = await Api.getExpensesBalance(activeAccount, fromDate);

            const data = {};
            Object.keys(parentCategories).forEach((key) => {
                data[key] = {
                    id: parentCategories[key].id,
                    amount: parentCategories[key].amount,
                    color: parentCategories[key].color,
                };
            });

            setData(data);
            setParentCategories(parentCategories);
            setExpensesBalance(balance);
            setIsLoading(false);
        }
        if (!parentCategory) {
            getCategoriesBalance();
        }
    }, [activeAccount, fromDate]);

    useEffect(() => {
        if (parentCategory) {
            const childrens = parentCategories[parentCategory]['childrens'];
            const data = {};
            Object.keys(childrens).forEach((key) => {
                data[key] = {
                    amount: childrens[key],
                    // color: childrens[key].color,
                };
            });
            setData(data);
        }
        else if (data){
            const data = {};
            Object.keys(parentCategories).forEach((key) => {
                data[key] = {
                    id: parentCategories[key].id,
                    amount: parentCategories[key].amount,
                    color: parentCategories[key].color,
                };
            });
            setData(data);
        }
    }, [parentCategory]);

    if (isLoading) {
        return <></>;
    }

    return (
        <div>
            <div className="flex flex-col gap-x-2 p-4 bg-gray-700 rounded py-4">
                <div className="flex flex-row justify-between items-center text-white text-2xl pb-4">
                    <div className="font-bold">
                        {numeral(expensesBalance).format("0,0.[00]")} €
                    </div>
                    <div>
                        <DatesSelect setDates={setFromDate} />
                    </div>
                </div>
                <div className="h-64">
                    <DoughnutChart data={data} setParentKey={setParentCategory} />
                </div>
            </div>
        </div>
    );
}
