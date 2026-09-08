import React, { useEffect, useState } from "react";
import Layout from "../../layout/Layout";
import Api from "../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faCheck,
    faXmark,
    faPenToSquare,
    faEye,
    faEyeSlash,
    faGripVertical,
} from "@fortawesome/free-solid-svg-icons";
import IconPicker from "../../../Components/IconPicker";

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
            {children({ handleProps: { ...attributes, ...listeners } })}
        </div>
    );
}

function DragHandle({ handleProps, enabled = true }) {
    if (!enabled) return null;
    return (
        <button
            type="button"
            {...handleProps}
            className="text-gray-400 hover:text-white cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
        >
            <FontAwesomeIcon icon={faGripVertical} />
        </button>
    );
}

export default function List() {
    const [parentCategories, setParentCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [parentCategory, setParentCategory] = useState(null);
    const [newCategory, setNewCategory] = useState(null);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [newParent, setNewParent] = useState(null);
    const [parentToEdit, setParentToEdit] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 10 },
        })
    );

    useEffect(() => {
        async function fetchParentCategories() {
            const data = await Api.getParentCategories();
            setParentCategories(data);
        }
        fetchParentCategories();
    }, []);

    useEffect(() => {
        async function fetchCategoriesByParent() {
            if (parentCategory) {
                const data = await Api.getCategoriesByParent(parentCategory.id);
                setCategories(data);
            } else {
                setCategories([]);
            }
        }
        fetchCategoriesByParent();
    }, [parentCategory]);

    // ---- ordering helpers ----
    const persistOrder = async (list, isParent) => {
        const items = list.map((el, i) => ({ id: el.id, position: i + 1 }));
        try {
            if (isParent) {
                await Api.reorderParentCategories(items);
            } else {
                await Api.reorderCategories(items);
            }
        } catch {
            // ignore
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

    // ---- parent category actions ----
    const handleParentCategoryClick = (pCat) => {
        setParentCategory(pCat);
    };

    const startCreateParent = () => {
        setNewParent({ name: "", icon: "fa-solid fa-folder", color: "#1F839F" });
    };

    const saveNewParent = async () => {
        if (!newParent.name.trim()) return;
        await Api.createParentCategory(newParent);
        const data = await Api.getParentCategories();
        setParentCategories(data);
        setNewParent(null);
    };

    const startEditParent = (pCat) => {
        setParentToEdit({
            id: pCat.id,
            name: pCat.name,
            icon: pCat.icon,
            color: pCat.color,
        });
    };

    const saveEditParent = async () => {
        await Api.updateParentCategory(
            {
                name: parentToEdit.name,
                icon: parentToEdit.icon,
                color: parentToEdit.color,
            },
            parentToEdit.id
        );
        const data = await Api.getParentCategories();
        setParentCategories(data);
        setParentToEdit(null);
    };

    // ---- sub category actions ----
    const handleCreateCategory = (parentCat) => {
        setNewCategory({
            parent_category_id: parentCat.id,
            icon: parentCat.icon,
        });
    };

    const saveNewCategory = async () => {
        await Api.createOrUpdateCategory(newCategory);
        const data = await Api.getCategoriesByParent(parentCategory.id);
        setCategories(data);
        setNewCategory(null);
    };

    const handleCategoryEditMode = (category) => {
        setCategoryToEdit({
            id: category.id,
            parent_category_id: category.parent_category_id,
            icon: category.icon,
            name: category.name,
        });
    };

    const saveEditCategory = async () => {
        const id = categoryToEdit.id;
        await Api.createOrUpdateCategory(categoryToEdit, id);
        const data = await Api.getCategoriesByParent(parentCategory.id);
        setCategories(data);
        setCategoryToEdit(null);
    };

    return (
        <Layout>
            <div className="flex flex-row gap-x-10 bg-background top-0 left-0 w-full px-10 mt-14">
                {/* Left panel: parent categories */}
                <div className="flex flex-col divide-y divide-gray-600/50 rounded-3xl bg-gray-700 py-5 basis-6/12">
                    <div className="flex flex-row items-center justify-between px-10 pb-4">
                        <div className="text-white font-semibold text-lg">Categories</div>
                        <button type="button" onClick={startCreateParent} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                            <FontAwesomeIcon icon={faPlus} /> New category
                        </button>
                    </div>

                    {newParent && (
                        <div className="flex flex-row gap-x-5 py-3 items-center text-white px-10">
                            <IconPicker
                                value={newParent.icon}
                                onChange={(i) => setNewParent((p) => ({ ...p, icon: i }))}
                                className="w-12 h-12 shrink-0"
                            />
                            <input
                                type="text"
                                value={newParent.name}
                                onChange={(e) => setNewParent((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Category name"
                                className="block w-64 p-3 border border-gray-700 rounded-lg bg-background focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500"
                            />
                            <input
                                type="color"
                                value={newParent.color}
                                onChange={(e) => setNewParent((p) => ({ ...p, color: e.target.value }))}
                                className="w-10 h-10 cursor-pointer rounded-lg bg-transparent p-0 border border-gray-700"
                                title="Color"
                            />
                            <button type="button" onClick={saveNewParent} disabled={!newParent.name.trim()}>
                                <FontAwesomeIcon icon={faCheck} className="text-2xl text-green-400" />
                            </button>
                            <button type="button" onClick={() => setNewParent(null)}>
                                <FontAwesomeIcon icon={faXmark} className="text-2xl text-gray-400" />
                            </button>
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) =>
                            onDragEnd(
                                event,
                                parentCategories,
                                setParentCategories,
                                true
                            )
                        }
                    >
                        <SortableContext
                            items={parentCategories.map((el) => String(el.id))}
                            strategy={verticalListSortingStrategy}
                        >
                            {parentCategories.map((pCat, index) => (
                                <SortableRow key={index} id={pCat.id}>
                                    {({ handleProps }) => (
                                        <div
                                            className={`flex flex-row items-center justify-between gap-x-5 py-3 px-10 transition ${
                                                pCat.enabled
                                                    ? ""
                                                    : "opacity-60"
                                            } ${
                                                parentCategory?.id === pCat.id
                                                    ? "bg-gray-600/60 cursor-pointer"
                                                    : "hover:bg-gray-400/10"
                                            }`}
                                            onClick={() =>
                                                parentToEdit?.id !== pCat.id &&
                                                handleParentCategoryClick(pCat)
                                            }
                                        >
                                            {parentToEdit?.id === pCat.id ? (
                                                <>
                                                    <div className="flex flex-row items-center gap-x-3 min-w-0">
                                                        <IconPicker
                                                            value={parentToEdit.icon}
                                                            onChange={(i) =>
                                                                setParentToEdit(
                                                                    (p) => ({
                                                                        ...p,
                                                                        icon: i,
                                                                    })
                                                                )
                                                            }
                                                            className="w-10 h-10 shrink-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={parentToEdit.name}
                                                            onChange={(e) =>
                                                                setParentToEdit(
                                                                    (p) => ({
                                                                        ...p,
                                                                        name: e.target.value,
                                                                    })
                                                                )
                                                            }
                                                            className="block w-40 p-2 border border-gray-700 rounded-lg bg-background text-white text-sm"
                                                        />
                                                        <input
                                                            type="color"
                                                            value={parentToEdit.color}
                                                            onChange={(e) =>
                                                                setParentToEdit(
                                                                    (p) => ({
                                                                        ...p,
                                                                        color: e.target.value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-9 h-9 cursor-pointer rounded-lg bg-transparent p-0 border border-gray-700"
                                                            title="Color"
                                                        />
                                                    </div>
                                                    <div className="flex flex-row gap-x-4 shrink-0">
                                                        <button type="button" onClick={saveEditParent}>
                                                            <FontAwesomeIcon icon={faCheck} className="text-xl text-green-400" />
                                                        </button>
                                                        <button type="button" onClick={() => setParentToEdit(null)}>
                                                            <FontAwesomeIcon icon={faXmark} className="text-xl text-gray-400" />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex flex-row items-center gap-x-5 min-w-0">
                                                        <div
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                                pCat.enabled ? "" : "opacity-40"
                                                            }`}
                                                            style={{ background: pCat.color }}
                                                        >
                                                            <FontAwesomeIcon icon={pCat.icon} />
                                                        </div>
                                                        <div className="text-white">{pCat.name}</div>
                                                    </div>
                                                    <div className="flex flex-row items-center gap-x-5 shrink-0">
                                                        <button type="button" onClick={() => startEditParent(pCat)} className="text-gray-400 hover:text-white" title="Edit">
                                                            <FontAwesomeIcon icon={faPenToSquare} />
                                                        </button>
                                                        <button type="button" onClick={() => toggleEnabled(pCat, true)} className="text-gray-400 hover:text-white" title={pCat.enabled ? "Disable" : "Enable"}>
                                                            <FontAwesomeIcon icon={pCat.enabled ? faEye : faEyeSlash} />
                                                        </button>
                                                        <DragHandle handleProps={handleProps} enabled />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </SortableRow>
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Right panel: sub categories of the selected parent */}
                <div className="flex flex-col divide-y divide-gray-600/50 rounded-3xl bg-gray-700 py-5 basis-6/12">
                    <div className="px-10 pb-4 text-white text-lg font-semibold min-h-[3rem]">
                        {parentCategory ? (
                            <div className="flex flex-row items-center justify-between">
                                <span>{parentCategory.name}</span>
                                <button type="button" onClick={() => handleCreateCategory(parentCategory)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                                    <FontAwesomeIcon icon={faPlus} /> New subcategory
                                </button>
                            </div>
                        ) : (
                            <span className="text-gray-500 font-normal text-base">
                                Select a category on the left to manage its subcategories
                            </span>
                        )}
                    </div>

                    {newCategory && (
                        <div className="flex flex-row gap-x-5 py-3 items-center text-white px-10">
                            <IconPicker
                                value={newCategory.icon}
                                onChange={(i) => setNewCategory((prev) => ({ ...prev, icon: i }))}
                                className="w-10 h-10 shrink-0"
                            />
                            <input
                                type="text"
                                value={newCategory.name || ""}
                                onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Subcategory name"
                                className="block w-64 p-3 border border-gray-700 rounded-lg bg-background text-white placeholder-gray-500"
                            />
                            <button type="button" onClick={saveNewCategory} disabled={!newCategory.name?.trim()}>
                                <FontAwesomeIcon icon={faCheck} className="text-2xl text-green-400" />
                            </button>
                            <button type="button" onClick={() => setNewCategory(null)}>
                                <FontAwesomeIcon icon={faXmark} className="text-2xl text-gray-400" />
                            </button>
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) =>
                            onDragEnd(event, categories, setCategories, false)
                        }
                    >
                        <SortableContext
                            items={categories.map((el) => String(el.id))}
                            strategy={verticalListSortingStrategy}
                        >
                            {categories.map((category, index) => (
                                <SortableRow key={index} id={category.id}>
                                    {({ handleProps }) => {
                                        const isEditing =
                                            category.id === categoryToEdit?.id;
                                        return (
                                            <div
                                                className={`flex flex-row items-center justify-between gap-x-5 px-10 transition hover:bg-gray-400/10 ${
                                                    category.enabled
                                                        ? ""
                                                        : "opacity-60"
                                                }`}
                                            >
                                                <div className="flex flex-row gap-x-5 py-3 items-center text-white min-w-0">
                                                    <div className="text-gray-500">#{category.id}</div>
                                                    {isEditing ? (
                                                        <>
                                                            <IconPicker
                                                                value={categoryToEdit.icon}
                                                                onChange={(newIcon) =>
                                                                    setCategoryToEdit(
                                                                        (prev) => ({
                                                                            ...prev,
                                                                            icon: newIcon,
                                                                        })
                                                                    )
                                                                }
                                                                className="w-10 h-10 shrink-0"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={categoryToEdit.name}
                                                                onChange={(e) =>
                                                                    setCategoryToEdit(
                                                                        (prev) => ({
                                                                            ...prev,
                                                                            name: e.target.value,
                                                                        })
                                                                    )
                                                                }
                                                                className="block w-44 p-2 border border-gray-700 rounded-lg bg-background text-white text-sm"
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div
                                                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                                                style={{ background: category.color }}
                                                            >
                                                                <FontAwesomeIcon icon={category.icon} />
                                                            </div>
                                                            <div>{category.name}</div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex flex-row items-center gap-x-5 shrink-0">
                                                    {isEditing && (
                                                        <>
                                                            <button type="button" onClick={saveEditCategory}>
                                                                <FontAwesomeIcon icon={faCheck} className="text-2xl text-green-400" />
                                                            </button>
                                                            <button type="button" onClick={() => setCategoryToEdit(null)}>
                                                                <FontAwesomeIcon icon={faXmark} className="text-2xl text-gray-400" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {!isEditing && (
                                                        <button type="button" onClick={() => handleCategoryEditMode(category)} className="text-gray-400 hover:text-white" title="Edit">
                                                            <FontAwesomeIcon icon={faPenToSquare} />
                                                        </button>
                                                    )}
                                                    {!isEditing && (
                                                        <button type="button" onClick={() => toggleEnabled(category, false)} className="text-gray-400 hover:text-white" title={category.enabled ? "Disable" : "Enable"}>
                                                            <FontAwesomeIcon icon={category.enabled ? faEye : faEyeSlash} />
                                                        </button>
                                                    )}
                                                    <DragHandle
                                                        handleProps={handleProps}
                                                        enabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }}
                                </SortableRow>
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </Layout>
    );
}
