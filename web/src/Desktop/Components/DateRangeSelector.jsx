import React, { useState } from "react";
import DatePicker from "react-datepicker";
import moment from "moment";

import "react-datepicker/dist/react-datepicker.css";

export default function DateRangeSelector({ setStartDate, setEndDate }) {
    const [customRange, setCustomRange] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(
        new Date(moment().startOf("year").format("YYYY-MM-DD"))
    );
    const [customEndDate, setCustomEndDate] = useState(
        new Date(moment().format("YYYY-MM-DD"))
    );

    const dateName = "Current year";

    const dates = {
        Today: moment().format("YYYY-MM-DD"),
        "Last 30 days": moment().subtract(30, "days").format("YYYY-MM-DD"),
        "Current month": moment().startOf("month").format("YYYY-MM-DD"),
        "Last 3 months": moment().subtract(3, "months").format("YYYY-MM-DD"),
        "Last 6 months": moment().subtract(6, "months").format("YYYY-MM-DD"),
        "Current year": moment().startOf("year").format("YYYY-MM-DD"),
        "1 year ago": moment().subtract(1, "year").format("YYYY-MM-DD"),
        Custom: "custom",
    };

    const handleChange = (event) => {
        const value = event.target.value;
        setCustomRange(value === "custom");
        let start = event.target.value;
        let end = moment().format("YYYY-MM-DD");
        if (value === "custom") {
            start = moment(customStartDate).format("YYYY-MM-DD");
            end = moment(customEndDate).format("YYYY-MM-DD");
        }
        setStartDate(start);
        setEndDate(end);
    };

    const handleChangeCustomDate = (fieldName, date) => {
        const formattedDate = moment(date).format("YYYY-MM-DD");
        if (fieldName === "from_date") {
            setCustomStartDate(date);
            setStartDate(formattedDate);
        } else {
            setCustomEndDate(date);
            setEndDate(formattedDate)
        }
    }

    const customRangeInputs = (
        <>
            <div className="relative cursor-pointer">
                <div className="absolute z-10 inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                    </svg>
                </div>
                <DatePicker
                    selected={customStartDate}
                    name="from_date"
                    onChange={(date) => handleChangeCustomDate('from_date', date)}
                    selectsStart
                    startDate={customStartDate}
                    endDate={customEndDate}
                    className="border cursor-pointer text-sm rounded-lg block w-full pl-10 p-2.5 w-36 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Select date start"
                />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative cursor-pointer">
                <div className="absolute z-10 inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                    </svg>
                </div>
                <DatePicker
                    selected={customEndDate}
                    name="to_date"
                    onChange={(date) => handleChangeCustomDate('to_date', date)}
                    selectsEnd
                    startDate={customEndDate}
                    endDate={customEndDate}
                    minDate={customStartDate}
                    className="border cursor-pointer text-sm rounded-lg block w-full pl-10 p-2.5 w-36 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Select date start"
                />
            </div>
        </>
    );

    return (
        <div className="flex flex-row gap-x-3">
            <div className="relative cursor-pointer">
                <div className="absolute z-10 inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                    </svg>
                </div>
                <select
                    name="from_date"
                    id="from_date"
                    onChange={handleChange}
                    className="border cursor-pointer text-sm rounded-lg block w-full pl-10 p-2.5 w-36 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
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
            <div className="flex flex-row gap-x-2 items-center">
                {customRange && customRangeInputs}
            </div>
        </div>
    );
}
