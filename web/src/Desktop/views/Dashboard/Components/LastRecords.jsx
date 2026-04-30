import { React, useEffect, useState } from "react";

import Api from "../../../../Api/Endpoints";
import RecordCard from "../../../Components/Record/Card";
import { Link } from "react-router-dom";

export default function LastRecords({ searchData, onRecordChange, refreshKey }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function getLastRecords() {
            const requestData = { ...searchData, limit: 5 };
            const result = await Api.getLastRecords(requestData);
            if (!cancelled) {
                setData(result);
                setIsLoading(false);
            }
        }
        getLastRecords();
        return () => { cancelled = true; };
    }, [searchData, refreshKey]);

    if (isLoading) {
        return <></>;
    }

    const account_id = searchData.account_id ?? "";

    return (
        <div>
            <div className="flex flex-col divide-y divide-gray-600/50 bg-background rounded p-px">
                {data.map((record) => {
                    return (
                        <div key={record.id}>
                            <RecordCard record={record} onRecordChange={onRecordChange} />
                        </div>
                    );
                })}
                <div className="px-5 py-3">
                    <Link to={`/record/list/${account_id}`}>
                        <div className="w-fit m-0 text-indigo-300 font-bold">
                            SHOW MORE
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
