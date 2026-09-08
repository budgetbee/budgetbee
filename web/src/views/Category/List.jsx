import { React, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Api from "../../Api/Endpoints";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPlus,
    faPenToSquare,
    faEye,
    faEyeSlash,
    faChevronUp,
    faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

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

    // ---- actions ----

    const moveItem = async (list, setList, index, dir, isParent) => {
        const target = index + dir;
        if (target < 0 || target >= list.length) return;
        const reordered = [...list];
        const [item] = reordered.splice(index, 1);
        reordered.splice(target, 0, item);
        setList(reordered);
        const items = reordered.map((el, i) => ({
            id: el.id,
            position: i + 1,
        }));
        try {
            if (isParent) {
                await Api.reorderParentCategories(items);
            } else {
                await Api.reorderCategories(items);
            }
        } catch {
            // keep local order; server order will apply on next load
        }
    };

    const toggleEnabled = async (item, isParent) => {
        const data = { enabled: !item.enabled };
        try {
            if (isParent) {
                await Api.updateParentCategory(data, item.id);
                setParentCategories((prev) =>
                    prev.map((el) =>
                        el.id === item.id
                            ? { ...el, enabled: !el.enabled }
                            : el
                    )
                );
            } else {
                await Api.createOrUpdateCategory(data, item.id);
                setCategories((prev) =>
                    prev.map((el) =>
                        el.id === item.id
                            ? { ...el, enabled: !el.enabled }
                            : el
                    )
                );
            }
        } catch {
            // ignore
        }
    };

    const actionsFor = (item, index, list, setList, isParent) => {
        const btn =
            "text-gray-500 hover:text-white px-1 py-1 text-base";
        return (
            <div className="flex flex-row items-center gap-x-1 shrink-0">
                <button
                    type="button"
                    onClick={() =>
                        toggleEnabled(item, isParent)
                    }
                    className={btn}
                    title={item.enabled ? "Disable" : "Enable"}
                >
                    <FontAwesomeIcon
                        icon={item.enabled ? faEye : faEyeSlash}
                        className={item.enabled ? "" : "text-gray-600"}
                    />
                </button>
                <button
                    type="button"
                    onClick={() => moveItem(list, setList, index, -1, isParent)}
                    className={`${btn} ${index === 0 ? "invisible" : ""}`}
                    title="Move up"
                >
                    <FontAwesomeIcon icon={faChevronUp} />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        moveItem(list, setList, index, 1, isParent)
                    }
                    className={`${btn} ${
                        index === list.length - 1 ? "invisible" : ""
                    }`}
                    title="Move down"
                >
                    <FontAwesomeIcon icon={faChevronDown} />
                </button>
            </div>
        );
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
                            <div
                                key={category.id}
                                className="flex flex-row gap-x-3 items-center justify-between"
                                index={index}
                            >
                                <Link
                                    to={"/category/" + category.id}
                                    className="flex flex-row gap-x-5 items-center text-white min-w-0"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            !category.enabled ? "opacity-40" : ""
                                        }`}
                                        style={{ background: category.color }}
                                    >
                                        <FontAwesomeIcon icon={category.icon} />
                                    </div>
                                    <div className={!category.enabled ? "text-gray-500" : ""}>
                                        {category.name}
                                    </div>
                                </Link>
                                <div className="flex flex-row items-center gap-x-3 shrink-0">
                                    <Link
                                        to={"/category/" + category.id}
                                        className="text-gray-500 hover:text-white"
                                        title="Edit"
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} />
                                    </Link>
                                    {actionsFor(
                                        category,
                                        index,
                                        categories,
                                        setCategories,
                                        false
                                    )}
                                </div>
                            </div>
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
                        <Link to="/category-parent">
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
                                key={parentCategory.id}
                                className="flex flex-row gap-x-3 items-center justify-between"
                                index={index}
                            >
                                <div
                                    className="flex flex-row gap-x-5 items-center text-white min-w-0 cursor-pointer"
                                    onClick={() =>
                                        handleParentCategoryClick(
                                            parentCategory.id
                                        )
                                    }
                                >
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            !parentCategory.enabled
                                                ? "opacity-40"
                                                : ""
                                        }`}
                                        style={{
                                            background: parentCategory.color,
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={parentCategory.icon}
                                        />
                                    </div>
                                    <div
                                        className={
                                            !parentCategory.enabled
                                                ? "text-gray-500"
                                                : ""
                                        }
                                    >
                                        {parentCategory.name}
                                    </div>
                                </div>
                                <div className="flex flex-row items-center gap-x-3 shrink-0">
                                    <Link
                                        to={
                                            "/category-parent/" +
                                            parentCategory.id
                                        }
                                        className="text-gray-500 hover:text-white"
                                        title="Edit"
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} />
                                    </Link>
                                    {actionsFor(
                                        parentCategory,
                                        index,
                                        parentCategories,
                                        setParentCategories,
                                        true
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            {body}
        </div>
    );
}
