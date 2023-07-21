import React, { useEffect, useState } from "react";

import Layout from "../../layout/Layout";
import Api from "../../../Api/Endpoints";
import AccountCard from "../../../Components/Account/Card";


export default function List() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        async function getAccounts() {
            const data = await Api.getAccounts();
            setData(data);
            setIsLoading(false);
        }
        getAccounts();
    }, []);

    let view = "";
    if (!isLoading) {
        view = data.map((account, index) => {
            return (
                <div key={index}>
                    <AccountCard account={account} />
                </div>
            );
        });
    }

    return (
        <Layout>
            <div className="bg-gray-800 top-0 left-0 w-full min-h-screen">
                <div className="flex flex-col divide-y divide-gray-600/50 rounded p-px mt-14">
                    {view}
                </div>
            </div>
        </Layout>
    );
}
