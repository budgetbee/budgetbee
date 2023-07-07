import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Api from "../../Api/Endpoints";
import RecordCard from "../../Components/Record/Card";
import TopNav from "../../layout/TopNav";
import Loader from "../../Components/Miscellaneous/Loader";

export default function List() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    const { account_id } = useParams();

    useEffect(() => {
        async function getRecords() {
            const data = await Api.getRecords(account_id);
            setData(data);
            setIsLoading(false);
        }
        getRecords();
    }, []);

    let view = <Loader classes="w-20 mt-10" />

    if (!isLoading) {
        view = data.map((record, index) => {
            return (
                <div key={index}>
                    <RecordCard record={record} showName={true} />
                </div>
            );
        });
    }

    return (
        <div className="absolute bg-gray-800 top-0 left-0 w-full min-h-screen">
            <TopNav />
            <div className="mt-14 flex flex-col divide-y divide-gray-600/50 rounded p-px">
                {view}
            </div>
        </div>
    );
}
