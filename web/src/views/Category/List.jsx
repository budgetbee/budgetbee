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
    faGripVertical,
} from "@fortawesome/free-solid-svg-icons";

// Drag & drop
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable wrapper: renders the row with DnD plumbing. The row content is a
// function that receives handleProps to attach to the drag handle button.
function SortableRow({ id, children, className = "" }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(id) });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={`${className} ${
                isDragging ? "opacity-50 relative z-10" : ""
            }`}
        >
            {children({
                handleProps: { ...attributes, ...listeners },
            })}
        </div>
    );
}

function DragHandle({ handleProps, enabled }) {
    if (!enabled) return null;
    return (
        <button
            type="button"
            {...handleProps}
            className="text-gray-500 hover:text-white px-1 py-1 cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
        >
            <FontAwesomeIcon icon={faGripVertical} />
        </button>
    );
}

export default function List() {
    const [isLoading, setIsLoading] = useState(true);
    const [parentCategories, setParentCategories] = useState(null);
    const [categories, setCategories] = useState(null);
    const [parentCategory, setParentCategory] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 10 },
        })
    );

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

    const persistOrder = async (list, isParent) => {
        const items = list.map((el, i) => ({ id: el.id, position: i + 1 }));
        try {
            if (isParent) {
                await Api.reorderParentCategories(items);
            } else {
                await Api.reorderCategories(items);
            }
        } catch {
            // server order will apply on next load
        }
    };

    const onDragEnd = (event, list, setList, isParent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = list.findIndex((el) => String(el.id) === active.id);
        const newIndex = list.findIndex((el) => String(el.id) === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(list, oldIndex, newIndex);
        setList(reordered);
        persistOrder(reordered, isParent);
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

    if (isLoading) {
        return <></>;
    }

    const renderSortableList = (list, setList, isParent, renderItem) => (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onDragEnd(event, list, setList, isParent)}
        >
            <SortableContext
                items={list.map((el) => String(el.id))}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-y-5 text-xl p-5 mt-14 pt-4">
                    {list.map((item, index) => (
                        <SortableRow
                            key={item.id}
                            id={item.id}
                            className="flex flex-row gap-x-3 items-center justify-between"
                        >
                            {({ handleProps }) => (
                                <>
                                    {renderItem(item, index, handleProps)}
                                </>
                            )}
                        </SortableRow>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );

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
                {renderSortableList(categories, setCategories, false, (category, index, handleProps) => (
                    <>
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
                            <div
                                className={
                                    !category.enabled
                                        ? "text-gray-500"
                                        : ""
                                }
                            >
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
                            <button
                                type="button"
                                onClick={() =>
                                    toggleEnabled(category, false)
                                }
                                className="text-gray-500 hover:text-white px-1 py-1"
                                title={
                                    category.enabled
                                        ? "Disable"
                                        : "Enable"
                                }
                            >
                                <FontAwesomeIcon
                                    icon={
                                        category.enabled
                                            ? faEye
                                            : faEyeSlash
                                    }
                                />
                            </button>
                            <DragHandle handleProps={handleProps} enabled />
                        </div>
                    </>
                ))}
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
                {renderSortableList(parentCategories, setParentCategories, true, (parentCategory, index, handleProps) => (
                    <>
                        <div
                            className="flex flex-row gap-x-5 items-center text-white min-w-0 cursor-pointer"
                            onClick={() =>
                                handleParentCategoryClick(parentCategory.id)
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
                            <button
                                type="button"
                                onClick={() =>
                                    toggleEnabled(parentCategory, true)
                                }
                                className="text-gray-500 hover:text-white px-1 py-1"
                                title={
                                    parentCategory.enabled
                                        ? "Disable"
                                        : "Enable"
                                }
                            >
                                <FontAwesomeIcon
                                    icon={
                                        parentCategory.enabled
                                            ? faEye
                                            : faEyeSlash
                                    }
                                />
                            </button>
                            <DragHandle handleProps={handleProps} enabled />
                        </div>
                    </>
                ))}
            </div>
        );
    }

    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            {body}
        </div>
    );
}
