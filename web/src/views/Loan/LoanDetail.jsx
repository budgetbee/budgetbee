import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Api from "../../Api/Endpoints";
import TopNav from "../../layout/TopNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import numeral from "numeral";

export default function LoanDetail() {
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
        if (!window.confirm("Delete this loan? Its payment history will be removed, but the generated records stay.")) {
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
            <div className="bg-[#0a0a0f] min-h-screen">
                <TopNav leftFunction={() => navigate(-1)} />
                <div className="text-center text-gray-500 pt-20">Loan not found.</div>
            </div>
        );
    }

    const isOwed = loan.direction === "owed";
    const accent = isOwed ? "text-red-400" : "text-green-400";
    const bar = isOwed ? "bg-red-500" : "bg-green-500";

    return (
        <div className="bg-[#0a0a0f] min-h-screen">
            <TopNav
                leftFunction={() => navigate(-1)}
                rightFunction={() => navigate(`/loan/${loan_id}/edit`)}
                rightIcon={faPen}
            />
            <div className="fixed top-14 bottom-0 left-0 right-0 flex flex-col max-w-full overflow-y-auto p-4">
                {error && (
                    <div className="bg-red-800 text-red-100 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-[#12121f] border border-gray-800 rounded-2xl p-4 mb-4">
                    <div className="flex flex-row items-center justify-between mb-1">
                        <div className="text-xl font-bold text-white">{loan.name}</div>
                        <button
                            onClick={handleDelete}
                            className="text-gray-600 hover:text-red-400 px-2"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                        {isOwed ? "You owe this money" : "Money owed to you"}
                    </div>

                    <div className="flex flex-row items-end justify-between mb-3">
                        <div>
                            <div className={`text-3xl font-bold ${accent}`}>
                                {numeral(loan.remaining).format("0,0.00")}
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">
                                remaining of {numeral(loan.total_amount).format("0,0.00")}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white font-semibold">
                                {numeral(loan.total_paid).format("0,0.00")}
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">
                                paid ({loan.progress}%)
                            </div>
                        </div>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${bar} transition-all`}
                            style={{ width: `${loan.progress}%` }}
                        />
                    </div>
                    {loan.account && (
                        <div className="text-xs text-gray-500 mt-3">
                            Account: {loan.account.name}
                        </div>
                    )}
                </div>

                <div className="flex flex-row items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">Payments</h3>
                    {!showPaymentForm && Number(loan.remaining) > 0 && (
                        <button
                            onClick={() => setShowPaymentForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faPlus} /> Payment
                        </button>
                    )}
                </div>

                {showPaymentForm && (
                    <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl p-4 mb-4">
                        <div className="text-white font-medium mb-3">Register payment</div>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder={`Amount (max ${numeral(loan.remaining).format("0,0.00")})`}
                            className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 mb-3"
                        />
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-3"
                        />
                        <div className="flex flex-row gap-2">
                            <button
                                onClick={handleAddPayment}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
                            >
                                Save payment
                            </button>
                            <button
                                onClick={() => setShowPaymentForm(false)}
                                className="px-4 py-2.5 bg-gray-700 text-white rounded-xl text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {(loan.payments || []).length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        No payments yet.
                    </div>
                ) : (
                    <div className="flex flex-col gap-y-2">
                        {loan.payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="bg-[#12121f] border border-gray-800 rounded-xl px-4 py-3 flex flex-row items-center justify-between"
                            >
                                <div>
                                    <div className="text-white font-medium">
                                        {numeral(payment.amount).format("0,0.00")}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {payment.payment_date}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-600">
                                    {loan.direction === "owed" ? "paid" : "received"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
