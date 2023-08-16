import React, { useEffect, useState } from "react";
import Api from "../../Api/Endpoints";
import AccountCard from "../../Components/Account/Card";
import TopNav from "../../layout/TopNav";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

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

    const handleAddNewClick = () => {
        window.location.href = '/account';
    };

    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            <TopNav menu={true} rightFunction={handleAddNewClick} rightIcon={faPlus} />
            <div className="flex flex-col divide-y divide-gray-600/50 rounded p-px mt-14">
                {view}
            </div>
        </div>
    );
}
