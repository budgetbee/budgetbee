import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Api from "../../Api/Endpoints";
import RecordCard from "../../Components/Record/Card";
import Loader from "../../Components/Miscellaneous/Loader";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

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
            <div className="basis-1/12 flex flex-row justify-left items-center bg-gray-700">
                <div
                    className="py-3 pl-5 pr-10 cursor-pointer"
                    onClick={() => window.history.back()}
                >
                    <FontAwesomeIcon
                        icon={faArrowLeft}
                        className={"text-white text-2xl"}
                    />
                </div>
            </div>
            <div className="flex flex-col divide-y divide-gray-600/50 rounded p-px">
                {view}
            </div>
        </div>
    );
}
