import React, { useEffect, useState } from "react";
import numeral from "numeral";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";

export default function TopExpensesCard({ searchData }) {
    const [topExpenses, setTopExpenses] = useState([]);

    useEffect(() => {
        async function getTopExpenses() {
            const data = await Api.getTopExpenses(searchData);
            setTopExpenses(data);
        }
        getTopExpenses();
    }, [searchData]);

    return (
        <div className="py-4 bg-gray-700 rounded-3xl h-full">
            <div className="flex flex-row divide-x text-lg py-2 text-left h-full">
                {topExpenses.map((category, index) => {
                    const inline_style = {
                        backgroundColor: category.color,
                    };
                    const name = category.name.length > 15 ? category.name.slice(0, 15) + "..." : category.name;
                    return (
                        <div
                            key={index}
                            className="px-5 basis-4/12 flex flex-col justify-between items-center"
                        >
                            <div className="flex flex-row gap-x-2 items-center">
                                <div
                                    className="m-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-500"
                                    style={inline_style}
                                >
                                    <FontAwesomeIcon icon={category.icon} className="text-sm"/>
                                </div>
                                <span>{name}</span>
                            </div>
                            <div>
                                <span className="font-bold">
                                    {numeral(category.amount).format("$0,0.00")}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
