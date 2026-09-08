import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Api from "../../../Api/Endpoints";
import Layout from "../../layout/Layout";

export default function LoanFormDesktop() {
    const navigate = useNavigate();
    const { loan_id } = useParams();

    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [name, setName] = useState("");
    const [direction, setDirection] = useState("owed");
    const [totalAmount, setTotalAmount] = useState("");
    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        async function getData() {
            const accountsResponse = await Api.getAccounts();
            const categoriesResponse = await Api.getCategories();
            if (!accountsResponse?.error) {
                setAccounts(accountsResponse.data || accountsResponse || []);
            }
            if (!categoriesResponse?.error) {
                setCategories(categoriesResponse.data || []);
            }
            if (loan_id) {
                const loanResponse = await Api.getLoan(loan_id);
                if (!loanResponse?.error && loanResponse.data) {
                    const loan = loanResponse.data;
                    setName(loan.name);
                    setDirection(loan.direction);
                    setTotalAmount(String(loan.total_amount));
                    setAccountId(loan.account_id || "");
                    setCategoryId(loan.category_id || "");
                    setStartDate(loan.start_date || "");
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
            category_id: categoryId || null,
            start_date: startDate || null,
        };

        const response = loan_id
            ? await Api.updateLoan(payload, loan_id)
            : await Api.createLoan(payload);

        if (response?.error || (response && !response.message)) {
            setError(response?.message || "Could not save the loan.");
            return;
        }
        navigate(loan_id ? `/loan/${loan_id}` : "/loans");
    };

    if (isLoading) {
        return <></>;
    }

    const inputClass =
        "basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-background sm:text-md focus:ring-blue-500 focus:border-blue-500";

    return (
        <Layout>
            <div className="px-10 mt-14 max-w-3xl">
                <h1 className="text-2xl font-bold mb-6">
                    {loan_id ? "Edit Loan" : "New Loan"}
                </h1>

                {error && (
                    <div className="bg-red-800 text-red-100 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-y-4">
                    <div className="flex flex-row items-center gap-x-4">
                        <label className="basis-3/12 text-gray-400">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Car loan"
                            className={inputClass}
                        />
                    </div>

                    <div className="flex flex-row items-center gap-x-4">
                        <label className="basis-3/12 text-gray-400">Direction</label>
                        <div className="flex basis-4/12 gap-x-3">
                            {["owed", "receivable"].map((dir) => (
                                <button
                                    key={dir}
                                    type="button"
                                    onClick={() => setDirection(dir)}
                                    className={`px-5 py-3 rounded-lg border text-sm font-medium transition-colors ${
                                        direction === dir
                                            ? dir === "owed"
                                                ? "bg-red-500/20 border-red-500/40 text-red-400"
                                                : "bg-green-500/20 border-green-500/40 text-green-400"
                                            : "border-gray-700 text-gray-500 hover:border-gray-500"
                                    }`}
                                >
                                    {dir === "owed" ? "I owe" : "Owed to me"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-x-4">
                        <label className="basis-3/12 text-gray-400">Total amount</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            placeholder="0.00"
                            className={inputClass}
                        />
                    </div>

                    <div className="flex flex-row items-center gap-x-4">
                        <label className="basis-3/12 text-gray-400">Account</label>
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-background sm:text-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select an account...</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-row items-center gap-x-4">
                        <label className="basis-3/12 text-gray-400">Category (optional)</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="basis-4/12 block w-full p-4 border border-gray-700 rounded-lg bg-background sm:text-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select category...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-row items-center gap-x-4">
                        <label className="basis-3/12 text-gray-400">Start date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="flex flex-row gap-x-3 mt-4">
                        <button
                            onClick={handleSave}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                        >
                            {loan_id ? "Save changes" : "Create loan"}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
