import React from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BudgetFormButton from "./BudgetFormButton";
import { Progress } from "@nextui-org/react";

export default function BudgetCard({ budget, setReload }) {

    return (
        <div className="flex flex-col gap-y-3 px-6 py-4 border-b bg-background border-gray-700">
            <div className="flex flex-row justify-between">
                <div className="flex flex-row items-center gap-x-2 font-medium whitespace-nowrap text-white">
                    <div
                        className="m-auto flex items-center justify-center w-9 h-9 rounded-full bg-gray-500"
                        style={{ backgroundColor: budget.category_color }}
                    >
                        <FontAwesomeIcon icon={budget.category_icon} />
                    </div>
                    <div className="flex flex-col">
                        <div className="text-gray-400 text-sm">{budget.parent_category_name}</div>
                        <div className="text-lg">{budget.category_name}</div>
                    </div>
                </div>
                <div>
                    <BudgetFormButton budget={budget} setIsUpdated={setReload} />
                </div>
            </div>
            <div className="font-medium whitespace-nowrap text-white">
                <Progress
                    label={"(" + numeral(budget.spent_percent).format("0,0.00") + " % Montly)"}
                    size="md"
                    value={budget.spent}
                    valueLabel={numeral(budget.spent).format("0,0.00") + " / " + numeral(budget.amount).format("0,0.00")}
                    maxValue={budget.amount}
                    color={budget.spent_percent >= 100 ? 'danger' : 'success'}
                    showValueLabel={true}
                    className="max-w-md"
                />
            </div>
        </div>
    );
}