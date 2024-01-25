import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";
import BudgetFormButton from "./BudgetFormButton";
import { Progress } from "@nextui-org/react";

export default function BudgetList( {forceReload}) {
    const [budgets, setBudgets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        async function getData() {
            const budgets = await Api.getAllBudgets();
            setBudgets(budgets.data);
            setIsLoading(false);
        }
        getData();
        setReload(false);
    }, [reload, forceReload]);

    let view = '';
    if (!isLoading) {
        view = budgets.map((budget) => {
            return (
                <tr
                    key={budget.id}
                    className="border-b bg-background border-gray-700"
                >
                    <th
                        scope="row"
                        className="flex flex-row items-center gap-x-2 px-6 py-4 font-medium whitespace-nowrap text-white"
                    >
                        <div className="pr-3">
                            <div
                                className="m-auto flex items-center justify-center w-9 h-9 rounded-full bg-gray-500"
                                style={{backgroundColor: budget.category_color}}
                            >
                                <FontAwesomeIcon icon={budget.category_icon} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-gray-400 text-sm">{budget.parent_category_name}</div>
                            <div className="text-lg">{budget.category_name}</div>
                        </div>
                    </th>
                    <th
                        scope="row"
                        className="px-6 py-4 font-medium whitespace-nowrap text-white"
                    >
                        <Progress
                            label={"(" + numeral(budget.spent_percent).format("0,0.00") + " %)"}
                            size="md"
                            value={budget.spent}
                            valueLabel={numeral(budget.spent).format("0,0.00") + " / " + numeral(budget.amount).format("0,0.00")}
                            maxValue={budget.amount}
                            color={budget.spent_percent >= 100 ? 'danger' : 'success'}
                            showValueLabel={true}
                            className="max-w-md"
                        />
                    </th>
                    <td className="px-6 py-4 text-right">
                        <BudgetFormButton budget={budget} setIsUpdated={setReload} />
                    </td>
                </tr>
            );
        });
    }

    return (
        <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                <tr>
                    <th scope="col" className="px-6 py-3">
                        Category
                    </th>
                    <th scope="col" className="px-6 py-3">
                        Amount
                    </th>
                    <th scope="col" className="px-6 py-3">

                    </th>
                </tr>
            </thead>
            <tbody>{view}</tbody>
        </table>
    );
}