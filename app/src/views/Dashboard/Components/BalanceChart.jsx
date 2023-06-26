import React, { useEffect, useState } from "react";
import numeral from "numeral";
import "numeral/locales/es";

import Api from "../../../Api/Endpoints";
import DatesSelect from "../../../Components/Miscellaneous/DatesSelect";
import LineChart from "../../../Components/Chart/LineChart";

export default function BalanceChart({ activeAccount }) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [balance, setBalance] = useState(null);
    const [fromDate, setFromDate] = useState(null);

    numeral.locale("es");

    useEffect(() => {
        async function getTimelineBalance() {
            const data = await Api.getTimelineBalance(activeAccount, fromDate);
            const balance = await Api.getBalance(activeAccount);
            setData(data);
            setBalance(balance);
            setIsLoading(false);
        }
        getTimelineBalance();
    }, [activeAccount, fromDate]);

    if (isLoading) {
        return <></>;
    }

    return (
        <div>
            <div className="flex flex-col gap-y-2 p-4 bg-gray-700 rounded py-4">
                <div className="flex flex-row justify-between items-center text-white text-2xl ">
                    <div className="font-bold">
                        {numeral(balance).format("0,0.[00]")} €
                    </div>
                    <div>
                        <DatesSelect setDates={setFromDate} />
                    </div>
                </div>
                <div className="h-48">
                    <LineChart data={data} />
                </div>
            </div>
        </div>
    );
}
