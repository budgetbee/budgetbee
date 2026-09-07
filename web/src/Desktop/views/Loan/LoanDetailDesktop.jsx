import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Api from "../../../Api/Endpoints";
import Layout from "../../layout/Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import numeral from "numeral";

export default function LoanDetailDesktop() {
    const navigate = useNavigate();
    const { loan_id } = useParams();

    const [loan, setLoan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [error, setError] = useState(null);

    async function loadLoan() {
        const response = await Api.getLoan(loan_id);
        if (!response?.error && response.data) {
            setLoan(response.data);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        loadLoan();
    }, [loan_id]);

    const handleAddPayment = async () => {
        setError(null);
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            setError("Enter a valid amount.");
            return;
        }
        const response = await Api.addLoanPayment(
            { amount: paymentAmount, payment_date: paymentDate },
            loan_id
        );
        if (response?.error || (response && !response.message)) {
            const errs = response?.errors || {};
            const first = Object.values(errs)[0];
            setError(first?.[0] || "Could not register the payment.");
            return;
        }
        setPaymentAmount("");
        setShowPaymentForm(false);
        await loadLoan();
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this loan? Payment history is removed, generated records stay.")) {
            return;
        }
        const response = await Api.deleteLoan(loan_id);
        if (response?.error) {
            setError(response.error);
            return;
        }
        navigate("/loans");
    };

    if (isLoading) {
        return <></>;
    }

    if (!loan) {
        return (
            <Layout>
                <div className="text-center text-gray-500 pt-20">Loan not found.</div>
            </Layout>
        );
    }

    const isOwed = loan.direction === "owed";
    const accent = isOwed ? "text-red-400" : "text-green-400";
    const bar = isOwed ? "bg-red-500" : "bg-green-500";

    return (
        <Layout>
            <div className="px-10 mt-14 max-w-3xl">
                {error && (
                    <div className="bg-red-800 text-red-100 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-row items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">{loan.name}</h1>
                    <div className="flex flex-row gap-2">
                        <button
                            onClick={() => navigate(`/loan/${loan_id}/edit`)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                        >
                            <FontAwesomeIcon icon={faPen} /> Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm"
                        >
                            <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                    </div>
                </div>

                <div className="bg-background border border-gray-700 rounded-xl p-6 mb-6">
                    <div className="flex flex-row items-center justify-between mb-3">
                        <span
                            className={`text-sm px-3 py-1 rounded-full ${
                                isOwed
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-green-500/20 text-green-400"
                            }`}
                        >
                            {isOwed ? "I owe" : "Owed to me"}
                        </span>
                        <span className="text-sm text-gray-500">
                            {loan.payments?.length || 0} payments
                        </span>
                    </div>
                    <div className="flex flex-row items-end justify-between mb-3">
                        <div>
                            <div className={`text-4xl font-bold ${accent}`}>
                                {numeral(loan.remaining).format("0,0.00")}
                            </div>
                            <div className="text-sm text-gray-500">
                                remaining of {numeral(loan.total_amount).format("0,0.00")}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-semibold text-white">
                                {numeral(loan.total_paid).format("0,0.00")}
                            </div>
                            <div className="text-sm text-gray-500">paid ({loan.progress}%)</div>
                        </div>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${bar} transition-all`}
                            style={{ width: `${loan.progress}%` }}
                        />
                    </div>
                    {loan.account && (
                        <div className="text-sm text-gray-500 mt-3">
                            Account: {loan.account.name}
                        </div>
                    )}
                </div>

                <div className="flex flex-row items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Payments</h2>
                    {!showPaymentForm && Number(loan.remaining) > 0 && (
                        <button
                            onClick={() => setShowPaymentForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faPlus} /> Register payment
                        </button>
                    )}
                </div>

                {showPaymentForm && (
                    <div className="bg-background border border-gray-700 rounded-xl p-5 mb-5">
                        <div className="flex flex-row gap-3 mb-3">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder={`Amount (max ${numeral(loan.remaining).format("0,0.00")})`}
                                className="flex-1 p-3 border border-gray-700 rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="p-3 border border-gray-700 rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleAddPayment}
                                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setShowPaymentForm(false)}
                                className="px-4 py-3 bg-gray-700 text-white rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {(loan.payments || []).length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-background rounded-xl">
                        No payments yet.
                    </div>
                ) : (
                    <div className="flex flex-col gap-y-2">
                        {loan.payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="bg-background border border-gray-700 rounded-xl px-5 py-4 flex flex-row items-center justify-between"
                            >
                                <div>
                                    <div className="text-white font-semibold">
                                        {numeral(payment.amount).format("0,0.00")}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {payment.payment_date}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {loan.direction === "owed" ? "paid" : "received"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
