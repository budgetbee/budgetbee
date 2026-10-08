import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select, SelectItem } from "@nextui-org/react";

import Api from "../../Api/Endpoints";

/**
 * The same two dropdowns the record modal uses — Parent, then Subcategory —
 * with the same look and the same behaviour: a small card, one coloured icon
 * per row, and a short popover that scrolls. Picking a category here is the
 * same gesture as picking it in the record form.
 *
 * It reports the chosen SUBCATEGORY id through onChange(id).
 *
 * What is picked here shows HERE, at once. The value coming from outside is what
 * is already stored, and callers do not always send it back after a pick: if the
 * dropdown only ever painted that value, choosing a subcategory of another
 * parent left it showing the previous category — one that is not even in the
 * list on screen — and the movement looked impossible to change.
 */

// Copied from Desktop/Components/Record/FormModal.jsx so both look identical.
const selectClassNames = {
    base: "w-full",
    trigger: "bg-transparent shadow-none border-0 h-auto min-h-[36px] py-1.5 px-0 data-[hover=true]:!bg-transparent data-[hover=true]:opacity-80",
    innerWrapper: "pt-0",
    value: "text-white font-medium text-sm",
    listbox: "bg-[#1a1a2e] text-white [&_li]:data-[hover=true]:!bg-[#252540] [&_li]:data-[hover=true]:!text-white",
    popoverContent: "bg-[#1a1a2e] border border-gray-700 text-white",
};

const CategoryIcon = ({ category, fallbackLetter = false }) => (
    <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
        style={{ backgroundColor: category?.color || "#666" }}
    >
        {fallbackLetter ? (category?.name || "?").charAt(0) : <FontAwesomeIcon icon={category?.icon} />}
    </div>
);

export default function CategorySelect({ value, onChange, parentId = null, label = "Category" }) {
    const [parents, setParents] = useState([]);
    const [all, setAll] = useState([]);
    const [parent, setParent] = useState(parentId ? String(parentId) : "");
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    // The subcategory on screen: follows the value from outside, and moves the
    // moment a subcategory is picked here.
    const [picked, setPicked] = useState(value ?? null);

    // Once the user chooses a parent himself, nothing fills it in behind his
    // back: the parent of the stored category is a starting point, not a rule.
    const [parentPicked, setParentPicked] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const [parentData, allData] = await Promise.all([
                Api.getParentCategories(),
                Api.getCategories(),
            ]);

            if (cancelled) {
                return;
            }

            setParents((parentData || []).filter((p) => p.enabled !== false));
            setAll(allData || []);
            setLoading(false);
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setPicked(value ?? null);
    }, [value]);

    // Given a category but no parent, find which parent it hangs from.
    useEffect(() => {
        if (parentPicked || parent || !value || !all.length) {
            return;
        }

        const found = all.find((c) => Number(c.id) === Number(value));
        const parentOf = found?.parent_category_id ?? found?.parent_id;

        if (parentOf) {
            setParent(String(parentOf));
        }
    }, [value, all, parent, parentPicked]);

    useEffect(() => {
        if (!parent) {
            setChildren([]);
            return;
        }

        let cancelled = false;

        async function load() {
            const data = await Api.getCategoriesByParent(parent);

            if (!cancelled) {
                setChildren((data || []).filter((c) => c.enabled !== false));
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [parent]);

    const selectedParent = parents.find((p) => Number(p.id) === Number(parent));

    // ONLY a category of the list on screen is painted. Falling back to the full
    // list painted a category that is not in the dropdown (the old one, while the
    // new parent's list was already loaded), which is both misleading and what
    // made NextUI complain on every render. While the list is still on its way,
    // the full list is all there is to show a name.
    const selected =
        children.find((c) => Number(c.id) === Number(picked)) ||
        (children.length === 0 ? all.find((c) => Number(c.id) === Number(picked)) : undefined);

    return (
        <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</div>
            <div className="flex flex-row gap-x-2">
                <div className="flex-1">
                    <Select
                        aria-label="Parent category"
                        placeholder="Parent"
                        size="sm"
                        items={parents}
                        selectionMode="single"
                        selectedKeys={parent ? [String(parent)] : []}
                        onChange={(e) => {
                            setParentPicked(true);
                            setParent(e.target.value);
                            // The category picked before belongs to the old parent.
                            setPicked(null);
                            onChange(null);
                        }}
                        classNames={selectClassNames}
                        isLoading={loading}
                        renderValue={() => (
                            <div className="flex flex-row items-center gap-x-2">
                                {selectedParent && (
                                    <>
                                        <CategoryIcon category={selectedParent} />
                                        <span className="text-white text-sm">{selectedParent.name}</span>
                                    </>
                                )}
                            </div>
                        )}
                    >
                        {(pc) => (
                            <SelectItem key={pc.id} value={pc.id} startContent={<CategoryIcon category={pc} />}>
                                {pc.name}
                            </SelectItem>
                        )}
                    </Select>
                </div>
                <div className="flex-1">
                    <Select
                        aria-label="Subcategory"
                        placeholder="Subcategory"
                        size="sm"
                        items={children}
                        selectionMode="single"
                        selectedKeys={picked ? [String(picked)] : []}
                        onChange={(e) => {
                            const next = e.target.value === "" ? null : Number(e.target.value);

                            setPicked(next);
                            onChange(next);
                        }}
                        classNames={selectClassNames}
                        isDisabled={!parent}
                        renderValue={() => (
                            <div className="flex flex-row items-center gap-x-2">
                                {selected && (
                                    <>
                                        <CategoryIcon category={selected} fallbackLetter={!selected.icon} />
                                        <span className="text-white text-sm">{selected.name}</span>
                                    </>
                                )}
                            </div>
                        )}
                    >
                        {(cat) => (
                            <SelectItem
                                key={cat.id}
                                value={cat.id}
                                startContent={<CategoryIcon category={cat} fallbackLetter={!cat.icon} />}
                            >
                                {cat.name}
                            </SelectItem>
                        )}
                    </Select>
                </div>
            </div>
        </div>
    );
}
