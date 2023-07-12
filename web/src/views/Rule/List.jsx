import React, { useEffect, useState } from "react";

import Api from "../../Api/Endpoints";
import RuleCard from "../../Components/Rule/Card";
import TopNav from "../../layout/TopNav";
import Loader from "../../Components/Miscellaneous/Loader";

export default function List() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        async function getRules() {
            const rules = await Api.getRules();
            setData(rules);
            setIsLoading(false);
        }
        getRules();
    }, []);

    const view = data.map((rule, index) => {
        return (
            <div key={index}>
                <RuleCard rule={rule} />
            </div>
        );
    });

    return (
        <div className="absolute bg-gray-800 top-0 left-0 w-full min-h-screen">
            <TopNav />
            <div className="mt-14 flex flex-col divide-y divide-gray-600/50 rounded p-px">
                {view}
                {isLoading && <Loader classes="w-10 my-5" />}
            </div>
        </div>
    );
}
