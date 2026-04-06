import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Api from "../../Api/Endpoints";
import RecordCard from "../../Components/Record/Card";
import TopNav from "../../layout/TopNav";
import Loader from "../../Components/Miscellaneous/Loader";

export default function List() {
    const [moreData, setMoreData] = useState(true);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const searchInputRef = useRef(null);

    const { account_id } = useParams();

    useEffect(() => {
        async function getRecords() {
            const newData = await Api.getPaginateRecords(account_id, page, searchTerm || undefined);
            setData((prevData) => [...prevData, ...newData]);
            if (newData.length === 0) {
                setMoreData(false);
            }
        }
        if (moreData === true) {
            getRecords();
        }
    }, [page, account_id, moreData, searchTerm]);

    function loadMore() {
        if (
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight
        ) {
            setPage((prevPage) => prevPage + 1);
        }
    }

    useEffect(() => {
        window.addEventListener("scroll", loadMore);
        return () => {
            window.removeEventListener("scroll", loadMore);
        };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const term = searchInputRef.current.value;
        setSearchTerm(term);
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const handleClear = () => {
        searchInputRef.current.value = "";
        setSearchTerm("");
        setData([]);
        setPage(1);
        setMoreData(true);
    };

    const view = data.map((record, index) => {
        return (
            <div key={index}>
                <RecordCard record={record} showName={true} />
            </div>
        );
    });

    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            <TopNav />
            <div className="mt-14 px-4 pt-4">
                <form onSubmit={handleSearch} className="flex gap-x-2 items-center">
                    <div className="relative flex-grow">
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
                            ref={searchInputRef}
                            className="border text-sm rounded-lg block w-full pl-10 p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search records..."
                        />
                    </div>
                    <button
                        type="submit"
                        className="text-white font-medium rounded-lg text-sm px-5 py-2.5 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-blue-800"
                    >
                        Search
                    </button>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-white font-medium rounded-lg text-sm px-5 py-2.5 bg-gray-600 hover:bg-gray-500 focus:outline-none"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>
            <div className="flex flex-col divide-y divide-gray-600/50 rounded p-px">
                {view}
                {moreData && <Loader classes="w-10 my-5" />}
            </div>
        </div>
    );
}
