import { React, useEffect, useState } from "react";

import Api from "../../../Api/Endpoints";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function Form({ setOpen, setCategory }) {
    const [isLoading, setIsLoading] = useState(true);
    const [parentCategories, setParentCategories] = useState(null);
    const [categories, setCategories] = useState(null);
    const [parentCategory, setParentCategory] = useState(null);

    useEffect(() => {
        async function getParentCategories() {
            const data = await Api.getParentCategories();
            setParentCategories(data);
            setIsLoading(false);
        }
        getParentCategories();
    }, []);

    useEffect(() => {
        if (parentCategory !== null) {
            setIsLoading(true);
            async function getCategoriesByParent() {
                const data = await Api.getCategoriesByParent(parentCategory);
                setCategories(data);
                setIsLoading(false);
            }
            getCategoriesByParent();
        }
    }, [parentCategory]);

    const handleParentCategoryClick = (id) => {
        setParentCategory(id);
    };

    const handleCategoryClick = (id, name) => {
        setCategory({id: id, name: name});
        setOpen(false);
    };

    const handleRemoveParentCategory = () => {
        setParentCategory(null);
    };

    const handleOpen = () => {
        setOpen(false);
    };

    if (isLoading) {
        return <></>;
    }

    let body;

    if (parentCategory !== null && categories !== null) {
        body = (
            <div className="">
                <div className="flex flex-row h-12 bg-gray-700 items-center px-5">
                    <div onClick={handleRemoveParentCategory}>
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className={"text-white text-2xl"}
                        />
                    </div>
                    <div></div>
                </div>
                <div className="flex flex-col gap-y-5 text-xl p-5">
                    {categories.map((category, index) => {
                        return (
                            <div
                                className="flex flex-row gap-x-5 items-center text-white"
                                index={index}
                                onClick={() =>
                                    handleCategoryClick(
                                        category.id,
                                        category.name
                                    )
                                }
                            >
                                <div
                                    className="w-12 h-12 rounded-full"
                                    style={{ background: category.color }}
                                ></div>
                                <div>{category.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    } else {
        body = (
            <div className="">
                <div className="flex flex-row h-12 bg-gray-700 items-center px-5">
                    <div onClick={handleOpen}>
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className={"text-white text-2xl"}
                        />
                    </div>
                    <div></div>
                </div>
                <div className="flex flex-col gap-y-5 text-xl p-5">
                    {parentCategories.map((parentCategory, index) => {
                        return (
                            <div
                                className="flex flex-row gap-x-5 items-center text-white"
                                index={index}
                                onClick={() =>
                                    handleParentCategoryClick(parentCategory.id)
                                }
                            >
                                <div
                                    className="w-12 h-12 rounded-full"
                                    style={{ background: parentCategory.color }}
                                ></div>
                                <div>{parentCategory.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return <div className="absolute bg-gray-800 top-0 left-0 w-full min-h-screen">{body}</div>;
}
