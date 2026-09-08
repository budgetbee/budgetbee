import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Api from "../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import IconPicker from "../../Components/IconPicker";

export default function Form() {
    const [isLoading, setIsLoading] = useState(true);
    const [category, setCategory] = useState(null);
    const [parentCategories, setParentCategories] = useState(null);
    const [icon, setIcon] = useState("");
    const [color, setColor] = useState("#1F839F");
    const [type, setType] = useState("expense");
    const [isTransfer, setIsTransfer] = useState(false);

    const { category_id, parent_id } = useParams();
    const location = useLocation();
    // /category-parent(/:id) manages a parent category; /category(/:id) a subcategory
    const isParentMode = location.pathname.includes("category-parent");
    const editId = isParentMode ? parent_id : category_id;

    useEffect(() => {
        async function getData() {
            if (isParentMode) {
                if (editId !== undefined) {
                    const parent = await Api.getParentCategoryById(editId);
                    if (parent) {
                        setCategory(parent);
                        setIcon(parent.icon || "");
                        setColor(parent.color || "#1F839F");
                        if (parent.type === "transfer") {
                            setIsTransfer(true);
                        } else {
                            setType(parent.type === "income" ? "income" : "expense");
                        }
                    }
                }
            } else {
                const parentCategories = await Api.getParentCategories();
                setParentCategories(parentCategories);
                if (editId !== undefined) {
                    const category = await Api.getCategory(editId);
                    setCategory(category);
                    setIcon(category.icon || "");
                }
            }
            setIsLoading(false);
        }
        getData();
    }, [editId, isParentMode]);

    const handleSaveForm = async (e) => {
        e.preventDefault();

        if (isParentMode) {
            const data = { name: e.target.name.value, icon, color };
            // The technical transfer category keeps its type: never send it.
            if (!isTransfer) {
                data.type = type;
            }
            if (editId !== undefined) {
                await Api.updateParentCategory(data, editId);
            } else {
                await Api.createParentCategory(data);
            }
        } else {
            const formData = new FormData(e.target);
            const formObject = Object.fromEntries(formData.entries());
            formObject.icon = icon;
            await Api.createOrUpdateCategory(formObject, editId);
        }
        window.location = "/category/list/";
    };

    if (isLoading) {
        return <></>;
    }

    return (
        <div className="min-h-screen bg-background">
            <form onSubmit={handleSaveForm}>
                <div className="fixed w-full top-0 basis-1/12 flex flex-row justify-between items-center bg-gray-700 mb-5 h-14">
                    <div
                        onClick={() => window.history.back()}
                        className="py-3 pl-5 pr-10 cursor-pointer"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className={"text-white text-2xl"}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="py-3 pl-10 pr-5 cursor-pointer"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className={"text-white text-2xl"}
                            />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-y-4 px-5 mt-14 pt-4">
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={category && category.name}
                        ></input>
                    </div>

                    {!isParentMode && (
                        <div className="mb-6">
                            <label
                                htmlFor="parent_category_id"
                                className="block mb-2 text-sm font-medium text-gray-900 text-white"
                            >
                                Parent category
                            </label>
                            <select
                                name="parent_category_id"
                                id="parent_category_id"
                                className="block w-full px-4 py-4 text-base text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                defaultValue={
                                    category && category.parent_category_id
                                }
                            >
                                {parentCategories.map(
                                    (parentCategory, index) => {
                                        return (
                                            <option
                                                key={index}
                                                className="text-black"
                                                value={parentCategory.id}
                                            >
                                                {parentCategory.name}
                                            </option>
                                        );
                                    }
                                )}
                            </select>
                        </div>
                    )}

                    <div className="mb-6">
                        <label
                            htmlFor="icon"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Icon
                        </label>
                        <div className="flex flex-row gap-x-5 items-center">
                            <IconPicker
                                value={icon}
                                onChange={setIcon}
                                className="w-20 h-20"
                            />
                            <div className="text-gray-500 text-sm break-all">
                                {icon ? (
                                    icon
                                ) : (
                                    <span className="italic">
                                        Tap the icon to choose one
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isParentMode && (
                        <div className="mb-6">
                            <label
                                htmlFor="type"
                                className="block mb-2 text-sm font-medium text-gray-900 text-white"
                            >
                                Type
                            </label>
                            {isTransfer ? (
                                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-gray-400 text-sm leading-relaxed">
                                    This is the technical{" "}
                                    <span className="text-white font-medium">
                                        Transfer
                                    </span>{" "}
                                    category, used to move money between
                                    accounts. It is neither an expense nor an
                                    income.
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-row gap-x-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setType("expense")}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                                type === "expense"
                                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                    : "text-gray-500 border-gray-800 bg-gray-800/40"
                                            }`}
                                        >
                                            Expense
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType("income")}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                                type === "income"
                                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                    : "text-gray-500 border-gray-800 bg-gray-800/40"
                                            }`}
                                        >
                                            Income
                                        </button>
                                    </div>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        {type === "income" ? (
                                            <>
                                                Records you add under this
                                                category count as{" "}
                                                <span className="text-green-400">
                                                    income
                                                </span>{" "}
                                                in the charts, reports and
                                                balances. Use it for salary,
                                                sales, refunds, other earnings…
                                            </>
                                        ) : (
                                            <>
                                                Records you add under this
                                                category count as{" "}
                                                <span className="text-red-400">
                                                    expenses
                                                </span>{" "}
                                                in the charts, reports and
                                                balances. This is the default
                                                for everyday spending.
                                            </>
                                        )}
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {isParentMode && (
                        <div className="mb-6">
                            <label
                                htmlFor="color"
                                className="block mb-2 text-sm font-medium text-gray-900 text-white"
                            >
                                Color
                            </label>
                            <div className="flex flex-row gap-x-5 items-center">
                                <input
                                    type="color"
                                    name="color"
                                    id="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-20 h-14 cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-1"
                                />
                                <span className="text-gray-500 text-sm">
                                    {color}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
