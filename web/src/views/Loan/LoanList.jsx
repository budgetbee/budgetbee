import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Api from "../../Api/Endpoints";
import TopNav from "../../layout/TopNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import numeral from "numeral";

export default function LoanList() {
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getData() {
            const response = await Api.getLoans();
            if (!response?.error) {
                setLoans(response.data || []);
            }
            setIsLoading(false);
        }
        getData();
    }, []);

    return (
        <div className="bg-[#0a0a0f] min-h-screen">
            <TopNav leftFunction={() => (window.location.href = "/dashboard")} />
            <div className="fixed top-14 bottom-0 left-0 right-0 flex flex-col max-w-full overflow-y-auto p-4">
                <div className="flex flex-row items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Loans</h2>
                    <Link
                        to="/loan/create"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faPlus} /> New
                    </Link>
                </div>

                {!isLoading && loans.length === 0 && (
                    <div className="text-center text-gray-500 py-16">
                        No loans yet.
                        <div className="text-sm mt-2">
                            Track money you owe (car loan, mortgage...) or money
                            owed to you (you sold something on credit).
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-y-3">
                    {loans.map((loan) => {
                        const isOwed = loan.direction === "owed";
                        return (
                            <Link
                                key={loan.id}
                                to={`/loan/${loan.id}`}
                                className="bg-[#12121f] border border-gray-800 rounded-2xl p-4"
                            >
                                <div className="flex flex-row items-center justify-between mb-2">
                                    <div className="text-white font-medium">
                                        {loan.name}
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            isOwed
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-green-500/20 text-green-400"
                                        }`}
                                    >
                                        {isOwed ? "I owe" : "Owed to me"}
                                    </span>
                                </div>
                                <div className="flex flex-row items-center justify-between text-sm mb-2">
                                    <span className="text-gray-400">
                                        Paid{" "}
                                        <span className="text-white font-semibold">
                                            {numeral(loan.total_paid).format("0,0.00")}
                                        </span>
                                    </span>
                                    <span className="text-gray-400">
                                        of{" "}
                                        <span className="text-white font-semibold">
                                            {numeral(loan.total_amount).format("0,0.00")}
                                        </span>
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            isOwed ? "bg-red-500" : "bg-green-500"
                                        }`}
                                        style={{ width: `${loan.progress}%` }}
                                    />
                                </div>
                                <div className="flex flex-row items-center justify-between mt-2 text-xs">
                                    <span className="text-gray-500">
                                        {loan.progress}% paid
                                    </span>
                                    <span
                                        className={
                                            isOwed
                                                ? "text-red-400 font-medium"
                                                : "text-green-400 font-medium"
                                        }
                                    >
                                        {numeral(loan.remaining).format("0,0.00")} left
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
