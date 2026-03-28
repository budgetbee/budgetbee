import React from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UpcomingExpenseFormButton from "./UpcomingExpenseFormButton";

export default function UpcomingExpenseCard({ expense, setReload }) {
    const isPast = expense.months_remaining === 0;

    return (
        <div className="flex flex-col gap-y-2 px-6 py-4 border-b bg-background border-gray-700">
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row items-center gap-x-3">
                    <div
                        className="flex items-center justify-center w-9 h-9 rounded-full"
                        style={{ backgroundColor: expense.category_color }}
                    >
                        <FontAwesomeIcon
                            icon={expense.category_icon}
                            className="text-white text-sm"
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="text-gray-400 text-xs">
                            {expense.parent_category_name} · {expense.category_name}
                        </div>
                        <div className="text-white font-semibold">
                            {expense.title}
                        </div>
                        <div className="text-gray-400 text-xs">
                            {expense.due_date}
                            {isPast ? (
                                <span className="ml-2 text-red-400">· Due</span>
                            ) : (
                                <span className="ml-2 text-gray-500">
                                    · {expense.months_remaining} month{expense.months_remaining !== 1 ? "s" : ""} away
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-y-1">
                    <div className="text-white font-semibold text-lg">
                        {numeral(expense.amount).format("0,0.00")}
                    </div>
                    {!isPast && (
                        <div className="text-gray-400 text-xs whitespace-nowrap">
                            {numeral(expense.monthly_amount).format("0,0.00")} / month
                        </div>
                    )}
                    <UpcomingExpenseFormButton
                        expense={expense}
                        setIsUpdated={setReload}
                    />
                </div>
            </div>
        </div>
    );
}
