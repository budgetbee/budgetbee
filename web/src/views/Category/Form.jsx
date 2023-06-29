import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Api from "../../Api/Endpoints";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function Form() {
    const [isLoading, setIsLoading] = useState(true);
    const [category, setCategory] = useState(null);
    const [parentCategories, setParentCategories] = useState(null);

    const { category_id } = useParams();

    useEffect(() => {
        async function getData() {
            const parentCategories = await Api.getParentCategories();
            setParentCategories(parentCategories);
            if (category_id !== undefined) {
                const category = await Api.getCategory(category_id);
                setCategory(category);
            }
            setIsLoading(false);
        }
        getData();
    }, []);

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        await Api.createOrUpdateCategory(formObject, category_id);
        window.location = "/category/list/";
    };

    if (isLoading) {
        return <></>;
    }

    return (
        <div className="min-h-screen bg-gray-800">
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

                    <div className="mb-6">
                        <label
                            htmlFor="type_id"
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
                            {parentCategories.map((parentCategory, index) => {
                                return (
                                    <option
                                        key={index}
                                        className="text-black"
                                        value={parentCategory.id}
                                    >
                                        {parentCategory.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="icon"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Icon
                        </label>
                        <div className="flex flex-row gap-x-5 justify-between items-center">
                            <div>
                                <FontAwesomeIcon icon="fa-solid fa-key" className={"text-white text-2xl"} />
                            </div>
                            <input
                                type="text"
                                name="icon"
                                id="icon"
                                className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                                defaultValue={category && category.icon}
                            ></input>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
