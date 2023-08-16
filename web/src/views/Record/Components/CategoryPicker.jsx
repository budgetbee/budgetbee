import { React, useEffect, useState } from "react";
import Api from "../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TopNav from "../../../layout/TopNav";

export default function Form({ setOpen, setCategory }) {
    const [parentCategories, setParentCategories] = useState(null);
    const [categories, setCategories] = useState(null);
    const [parentCategory, setParentCategory] = useState(null);

    useEffect(() => {
        async function getParentCategories() {
            const data = await Api.getParentCategories();
            setParentCategories(data);
        }
        getParentCategories();
    }, []);

    useEffect(() => {
        if (parentCategory !== null) {
            async function getCategoriesByParent() {
                const data = await Api.getCategoriesByParent(parentCategory);
                setCategories(data);
            }
            getCategoriesByParent();
        }
    }, [parentCategory]);

    const handleParentCategoryClick = (id) => {
        setParentCategory(id);
    };

    const handleCategoryClick = (id, name) => {
        setCategory({ id: id, name: name });
        setOpen(false);
    };

    const handleRemoveParentCategory = () => {
        setParentCategory(null);
    };

    const handleOpen = () => {
        setOpen(false);
    };

    let categoryList =
        parentCategory !== null && categories !== null
            ? categories
            : parentCategories;

    if (categoryList === null) {
        categoryList = [];
    }

    const backFunction = parentCategory
        ? handleRemoveParentCategory
        : handleOpen;

    return (
        <div className="absolute flex flex-col w-full h-screen">
            <TopNav leftFunction={backFunction} />
            <div className="h-full mt-14 bg-gray-900 flex flex-col gap-y-5 text-xl p-5">
                {categoryList.map((category, index) => {
                    return (
                        <div
                            className="flex flex-row gap-x-5 items-center text-white cursor-pointer"
                            index={index}
                            onClick={() =>
                                parentCategory
                                    ? handleCategoryClick(
                                          category.id,
                                          category.name
                                      )
                                    : handleParentCategoryClick(category.id)
                            }
                        >
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: category.color }}
                            >
                                <FontAwesomeIcon icon={category.icon} />
                            </div>
                            <div>{category.name}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
