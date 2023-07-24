import React, { useState } from "react";

import DateRangeSelector from "../Components/DateRangeSelector";

export default function TopNav({ setSearchData }) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const handleSearchForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        let formObject = Object.fromEntries(formData.entries());
        formObject.from_date = startDate;
        formObject.to_date = endDate;
        setSearchData((prevData) => ({ ...prevData, ...formObject }));
    };

    return (
        <div className="w-full flex flex-row px-10 gap-x-5 h-24 items-center">
            <div className="flex gap-x-2 items-center basis-10/12">
                <form onSubmit={handleSearchForm}>
                    <div date-rangepicker="true" className="flex gap-x-2 items-center">
                        <div>
                            <DateRangeSelector
                                setStartDate={setStartDate}
                                setEndDate={setEndDate}
                            />
                        </div>
                        <div className="px-5">
                            <label
                                htmlFor="search"
                                className="mb-2 text-sm font-medium sr-only text-white"
                            >
                                Search
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="search"
                                    id="search"
                                    name="search_term"
                                    className="border cursor-pointer text-sm rounded-lg block w-full pl-10 p-2.5 w-80 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search"
                                ></input>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="text-white focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-blue-800"
                        >
                            Filter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
