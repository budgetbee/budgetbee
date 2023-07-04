import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function DatesSelect({ setDates }) {
    const currentDate = new Date();
    const [isOpen, setIsOpen] = useState(false);
    const [fromDate, setFromDate] = useState(
        currentDate.getFullYear() + "-01-01"
    );
    const [dateName, setDateName] = useState("Current year");

    const today = new Date();

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);

    const last3Months = new Date();
    last3Months.setMonth(last3Months.getMonth() - 3);

    const last6Months = new Date();
    last6Months.setMonth(last6Months.getMonth() - 6);

    const thisYear = new Date();
    thisYear.setMonth(0, 1);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const dates = {
        "Today": today.toISOString(),
        "Last 30 days": last30Days.toISOString(),
        "Current month": firstDayOfMonth.toISOString(),
        "Last 3 months": last3Months.toISOString(),
        "Last 6 months": last6Months.toISOString(),
        "Current year": thisYear.toISOString(),
        "1 year ago": oneYearAgo.toISOString(),
    };

    const handleSetDates = (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const selectedText = selectedOption.text;
        const selectedValue = selectedOption.value;

        setFromDate(selectedValue);
        setDateName(selectedText);
        setDates(selectedValue);
        setIsOpen(false);
    };

    const handleSaveDates = () => {
        setDates(fromDate);
        setIsOpen(false);
    };

    const modal = (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-30">
            <div className="w-11/12 bg-gray-900 text-white rounded z-40">
                <div className="flex flex-row items-center justify-between px-3 py-4">
                    <div className="text-xl">Dates</div>
                    <div onClick={handleSaveDates}>
                        <FontAwesomeIcon icon="fa-solid fa-check" />
                    </div>
                </div>
                <div className="max-h-96 overflow-auto w-11/12 m-auto bg-black block px-3 py-4 my-2">
                    <div className="w-full">
                        <select
                            className="bg-black w-full"
                            onChange={handleSetDates}
                        >
                            {Object.entries(dates).map(([key, value]) => {
                                return (
                                    <option
                                        key={key}
                                        value={value}
                                        selected={key === dateName}
                                    >
                                        {key}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>
            <div
                className="fixed inset-0 flex flex-col items-center justify-center bg-black/50"
                onClick={() => setIsOpen(false)}
            ></div>
        </div>
    );

    return (
        <div>
            {isOpen && modal}
            <div onClick={() => setIsOpen(true)}>{dateName}</div>
        </div>
    );
}
