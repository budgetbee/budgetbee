import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Api from "../../../Api/Endpoints";
import RecordCard from "../../Components/Record/Card";
import TopNav from "../../../layout/TopNav";
import Loader from "../../../Components/Miscellaneous/Loader";

export default function List() {
    const [moreData, setMoreData] = useState(true);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);

    const { account_id } = useParams();

    useEffect(() => {
        async function getRecords() {
            const newData = await Api.getPaginateRecords(account_id, page);
            setData((prevData) => [...prevData, ...newData]);
            if (newData.length === 0) {
                setMoreData(false);
            }
        }
        if (moreData === true) {
            getRecords();
        }
    }, [page, account_id, moreData]);

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
            <div className="mt-14 flex flex-col divide-y divide-gray-600/50 rounded p-px">
                {view}
                {moreData && <Loader classes="w-10 my-5" />}
            </div>
        </div>
    );
}
