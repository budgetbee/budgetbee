import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../../../Api/Endpoints";
import Layout from "../../layout/Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import numeral from "numeral";

export default function LoanListDesktop() {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    async function loadLoans() {
        const response = await Api.getLoans();
        if (!response?.error) {
            setLoans(response.data || []);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        loadLoans();
    }, []);

    const handleDelete = async (e, loan) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`Delete "${loan.name}"? Payment history is removed, generated records stay.`)) {
            return;
        }
        const response = await Api.deleteLoan(loan.id);
        if (!response?.error) {
            await loadLoans();
        }
    };

    return (
        <Layout>
            <div className="px-5 mt-10 max-w-4xl">
                <div className="flex flex-row items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Loans &amp; Debts</h1>
                    <button
                        onClick={() => navigate("/loan/create")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faPlus} /> New Loan
                    </button>
                </div>

                {!isLoading && loans.length === 0 && (
                    <div className="text-center text-gray-500 py-16 bg-background rounded-xl">
                        No loans yet. Track money you owe or money owed to you
                        with flexible instalments.
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    {loans.map((loan) => {
                        const isOwed = loan.direction === "owed";
                        return (
                            <div
                                key={loan.id}
                                onClick={() => navigate(`/loan/${loan.id}`)}
                                className="bg-background border border-gray-700 rounded-xl p-5 cursor-pointer hover:border-gray-500 transition-colors"
                            >
                                <div className="flex flex-row items-center justify-between mb-2">
                                    <div className="text-white font-semibold text-lg">
                                        {loan.name}
                                    </div>
                                    <div className="flex flex-row items-center gap-2">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                                isOwed
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-green-500/20 text-green-400"
                                            }`}
                                        >
                                            {isOwed ? "I owe" : "Owed to me"}
                                        </span>
                                        <button
                                            onClick={(e) => handleDelete(e, loan)}
                                            className="text-gray-600 hover:text-red-400"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-row items-end justify-between mb-2">
                                    <div>
                                        <span className={`text-2xl font-bold ${isOwed ? "text-red-400" : "text-green-400"}`}>
                                            {numeral(loan.remaining).format("0,0.00")}
                                        </span>
                                        <span className="text-gray-500 text-sm ml-1">
                                            / {numeral(loan.total_amount).format("0,0.00")}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {loan.progress}% paid
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${isOwed ? "bg-red-500" : "bg-green-500"}`}
                                        style={{ width: `${loan.progress}%` }}
                                    />
                                </div>
                                <div className="flex flex-row items-center justify-between mt-2 text-xs">
                                    <span className="text-gray-500">
                                        Paid {numeral(loan.total_paid).format("0,0.00")}
                                    </span>
                                    <span className="text-gray-500">
                                        {loan.payments_count || 0} payments
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
