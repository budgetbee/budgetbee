import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Api from "../../Api/Endpoints";
import TopNav from "../../layout/TopNav";
import CategoryPicker from "../Record/Components/CategoryPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function LoanForm() {
    const navigate = useNavigate();
    const { loan_id } = useParams();

    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [name, setName] = useState("");
    const [direction, setDirection] = useState("owed");
    const [totalAmount, setTotalAmount] = useState("");
    const [accountId, setAccountId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [category, setCategory] = useState({ id: 0, name: "" });
    const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function getData() {
            const accountsResponse = await Api.getAccounts();
            if (!accountsResponse?.error) {
                setAccounts(accountsResponse.data || accountsResponse || []);
            }
            if (loan_id) {
                const loanResponse = await Api.getLoan(loan_id);
                if (!loanResponse?.error && loanResponse.data) {
                    const loan = loanResponse.data;
                    setName(loan.name);
                    setDirection(loan.direction);
                    setTotalAmount(String(loan.total_amount));
                    setAccountId(loan.account_id || "");
                    setStartDate(loan.start_date || "");
                    if (loan.category) {
                        setCategory({ id: loan.category.id, name: loan.category.name });
                    }
                }
            }
            setIsLoading(false);
        }
        getData();
    }, [loan_id]);

    const handleSave = async () => {
        setError(null);
        if (!name.trim() || !totalAmount || Number(totalAmount) <= 0) {
            setError("Name and a valid total amount are required.");
            return;
        }
        const payload = {
            name: name.trim(),
            direction,
            total_amount: totalAmount,
            account_id: accountId || null,
            start_date: startDate || null,
        };
        if (category.id) {
            payload.category_id = category.id;
        }

        let response;
        if (loan_id) {
            response = await Api.updateLoan(payload, loan_id);
        } else {
            response = await Api.createLoan(payload);
        }

        if (response?.error || (response && !response.message)) {
            setError(response?.message || response?.errors?.name?.[0] || "Could not save the loan.");
            return;
        }
        navigate(loan_id ? `/loan/${loan_id}` : "/loans");
    };

    if (isLoading) {
        return <></>;
    }

    return (
        <div className="bg-[#0a0a0f] min-h-screen">
            {categoryPickerOpen && (
                <CategoryPicker
                    setOpen={setCategoryPickerOpen}
                    setCategory={(cat) => {
                        setCategory(cat);
                        setCategoryPickerOpen(false);
                    }}
                />
            )}
            <form>
                <TopNav
                    leftFunction={() => navigate(-1)}
                    rightFunction={handleSave}
                    rightIcon={faCheck}
                />
                <div className="fixed top-14 bottom-0 left-0 right-0 flex flex-col max-w-full overflow-y-auto p-4">
                    {error && (
                        <div className="bg-red-800 text-red-100 p-3 rounded-xl mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <label className="text-gray-400 text-sm mb-1">What is it for?</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Car loan, Sale of my motorcycle..."
                        className="w-full bg-[#12121f] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 mb-4"
                    />

                    <label className="text-gray-400 text-sm mb-1">Direction</label>
                    <div className="flex flex-row gap-x-1 bg-[#12121f] rounded-xl p-1 mb-4">
                        <div
                            onClick={() => setDirection("owed")}
                            className={`flex-1 text-center py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                                direction === "owed"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "text-gray-500"
                            }`}
                        >
                            I owe
                        </div>
                        <div
                            onClick={() => setDirection("receivable")}
                            className={`flex-1 text-center py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                                direction === "receivable"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "text-gray-500"
                            }`}
                        >
                            Owed to me
                        </div>
                    </div>

                    <label className="text-gray-400 text-sm mb-1">Total amount</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#12121f] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 mb-4"
                    />

                    <label className="text-gray-400 text-sm mb-1">
                        Account (where payments are made / received)
                    </label>
                    <div className="flex flex-col gap-y-2 mb-4">
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full bg-[#12121f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Select an account...</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <label className="text-gray-400 text-sm mb-1">Category (optional)</label>
                    <div
                        className="w-full bg-[#12121f] border border-gray-700 rounded-xl px-4 py-3 text-white mb-4 flex flex-row items-center justify-between cursor-pointer"
                        onClick={() => setCategoryPickerOpen(true)}
                    >
                        <span className={category.name ? "" : "text-gray-600"}>
                            {category.name || "Select category..."}
                        </span>
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600" />
                    </div>

                    <label className="text-gray-400 text-sm mb-1">Start date (optional)</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[#12121f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-4"
                    />
                </div>
            </form>
        </div>
    );
}
