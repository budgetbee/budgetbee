import React, { useEffect, useState } from "react";
import numeral from "numeral";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";

export default function BalanceCard({ searchData }) {
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        async function getBalance() {
            const balance = await Api.getBalance(searchData);
            setBalance(balance);
        }
        getBalance();
    }, [searchData]);

    return (
        <div className="flex flex-col gap-x-2 items-center justify-between px-5 py-4 bg-gray-700 rounded-3xl py-4 h-full">
            <div className="flex flex-row justify-between items-center text-white text-2xl">
                <div className="flex flex-row gap-x-3 items-center">
                    <FontAwesomeIcon
                        icon="fa-solid fa-coins"
                        className="text-[#F2F2DA]"
                    />
                    <span>Balance</span>
                </div>
            </div>
            <div className="font-bold text-2xl text-left">
                {numeral(balance).format("$0,0.00")}
            </div>
        </div>
    );
}
