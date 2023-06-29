import { React, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Api from "../../Api/Endpoints";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";

export default function List() {
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

    const handleRemoveParentCategory = () => {
        setParentCategory(null);
    };

    if (isLoading) {
        return <></>;
    }

    let body;

    if (parentCategory !== null && categories !== null) {
        body = (
            <div className="">
                <div className="fixed w-full top-0 flex flex-row justify-between bg-gray-700 items-center px-5 h-14">
                    <div onClick={handleRemoveParentCategory}>
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className={"text-white text-2xl"}
                        />
                    </div>
                    <div>
                        <Link to="/category">
                            <FontAwesomeIcon
                                icon={faPlus}
                                className={"text-white text-2xl"}
                            />
                        </Link>
                    </div>
                </div>
                <div className="flex flex-col gap-y-5 text-xl p-5 mt-14 pt-4">
                    {categories.map((category, index) => {
                        return (
                            <Link to={"/category/" + category.id}>
                                <div
                                    className="flex flex-row gap-x-5 items-center text-white"
                                    index={index}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ background: category.color }}
                                    >
                                        <FontAwesomeIcon icon={category.icon} />
                                    </div>
                                    <div>{category.name}</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    } else {
        body = (
            <div className="">
                <div className="fixed w-full top-0 flex flex-row justify-between bg-gray-700 items-center px-5 h-14">
                    <div>
                        <Link to={"/dashboard"}>
                            <FontAwesomeIcon
                                icon={faArrowLeft}
                                className={"text-white text-2xl"}
                            />
                        </Link>
                    </div>
                    <div>
                        <Link to="/category">
                            <FontAwesomeIcon
                                icon={faPlus}
                                className={"text-white text-2xl"}
                            />
                        </Link>
                    </div>
                </div>
                <div className="flex flex-col gap-y-5 text-xl p-5 mt-14 pt-4">
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
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{ background: parentCategory.color }}
                                >
                                    <FontAwesomeIcon
                                        icon={parentCategory.icon}
                                    />
                                </div>
                                <div>{parentCategory.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bg-gray-800 top-0 left-0 w-full min-h-screen">
            {body}
        </div>
    );
}
