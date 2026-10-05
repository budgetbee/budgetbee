import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
} from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";

// What each field means, in the words a person uses, not the column names.
const FIELD_LABELS = {
    date: "Date",
    name: "Description",
    amount: "Amount",
    amount_in: "Money in (Abono / credit)",
    type: "Type (income / expense)",
    category_id: "Category",
    from_account_id: "From account",
    to_account_id: "To account",
    rate: "Exchange rate",
};

const REQUIRED_FIELDS = ["date", "name", "amount"];

// Field box, label and dropdown, copied from the record modal so this screen
// is the same screen as the rest of the app: the app is a dark theme painted
// by hand, and a NextUI default (light) background makes this unreadable.
const BOX = "rounded-2xl border border-gray-800 bg-[#1a1a2e] px-3 py-2";
const LABEL = "text-xs uppercase tracking-wider text-gray-500";

const selectClassNames = {
    base: "w-full",
    trigger:
        "bg-transparent shadow-none border-0 h-auto min-h-[32px] py-0.5 px-0 data-[hover=true]:!bg-transparent data-[hover=true]:opacity-80",
    innerWrapper: "pt-0",
    value: "text-white font-medium text-sm",
    listbox:
        "bg-[#1a1a2e] text-white [&_li]:data-[hover=true]:!bg-[#252540] [&_li]:data-[hover=true]:!text-white",
    popoverContent: "bg-[#1a1a2e] border border-gray-700 text-white",
};

// "1-5, 12, 20-22" -> [1,2,3,4,5,12,20,21,22]. Written the way a person writes
// it, and forgiving: anything that is not a number is simply ignored.
const parseRowNumbers = (text) => {
    const numbers = [];
    String(text || "")
        .split(/[,\s;]+/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .forEach((chunk) => {
            const range = chunk.match(/^(\d+)\s*[-–]\s*(\d+)$/);
            if (range) {
                let from = parseInt(range[1], 10);
                let to = parseInt(range[2], 10);
                if (from > to) {
                    [from, to] = [to, from];
                }
                for (let i = from; i <= Math.min(to, from + 2000); i++) {
                    if (i > 0) {
                        numbers.push(i);
                    }
                }
                return;
            }
            if (/^\d+$/.test(chunk) && parseInt(chunk, 10) > 0) {
                numbers.push(parseInt(chunk, 10));
            }
        });

    return [...new Set(numbers)].sort((a, b) => a - b);
};

export default function ColumnMappingModal({
    isOpen,
    onClose,
    inspection,
    loading,
    errorMsg,
    onConfirm,
}) {
    // column index -> field name ("" = ignore this column)
    const [mapping, setMapping] = useState({});
    const [accountId, setAccountId] = useState("");
    const [accounts, setAccounts] = useState([]);
    const [wasRemembered, setWasRemembered] = useState(false);
    // Rows the user does not want imported, numbered as they are in the file.
    const [skipRows, setSkipRows] = useState([]);
    const [typedRows, setTypedRows] = useState("");
    const [rememberedRows, setRememberedRows] = useState(false);

    useEffect(() => {
        const loadAccounts = async () => {
            try {
                const response = await Api.getAccounts();
                setAccounts(Array.isArray(response) ? response : []);
            } catch (error) {
                setAccounts([]);
            }
        };
        loadAccounts();
    }, []);

    // Pre-fill: what this user already confirmed for this file shape wins; if
    // there is nothing remembered, the detected suggestions are used.
    useEffect(() => {
        if (!inspection) {
            return;
        }
        const saved = inspection.saved_mapping || null;
        const source = saved && Object.keys(saved).length > 0 ? saved : inspection.suggested || {};
        setWasRemembered(Boolean(saved && Object.keys(saved).length > 0));
        setMapping({ ...source });
        setAccountId(
            inspection.saved_account_id ? String(inspection.saved_account_id) : ""
        );

        // The lines this user left out last time for this file layout: the same
        // export carries the same junk lines every month.
        const savedRows = Array.isArray(inspection.saved_skip_rows)
            ? inspection.saved_skip_rows
            : [];
        setSkipRows(savedRows);
        setRememberedRows(savedRows.length > 0);
        setTypedRows("");
    }, [inspection]);

    const columns = inspection?.columns || [];
    const preview = inspection?.preview || [];
    const previewNumbers = inspection?.preview_row_numbers || [];
    const tail = inspection?.preview_tail || [];
    const tailNumbers = inspection?.preview_tail_row_numbers || [];
    const headerRow = inspection?.header_row || null;

    // A field can only be used once: the options of the others are greyed out.
    const usedFields = useMemo(
        () => Object.values(mapping).filter((field) => field),
        [mapping]
    );

    const missingRequired = REQUIRED_FIELDS.filter(
        (field) => !usedFields.includes(field)
    );

    // A bank export brings no accounts: then the user has to say which account
    // these movements belong to, otherwise they cannot be stored.
    const hasAccountColumn =
        usedFields.includes("from_account_id") || usedFields.includes("to_account_id");
    const needsAccount = !hasAccountColumn && !accountId;

    const setColumnField = (index, field) => {
        setMapping((previous) => {
            const next = { ...previous };
            // Free the field from any other column before assigning it here.
            Object.keys(next).forEach((key) => {
                if (next[key] === field && Number(key) !== Number(index)) {
                    delete next[key];
                }
            });
            if (field) {
                next[index] = field;
            } else {
                delete next[index];
            }
            return next;
        });
    };

    const suggestedFor = (index) => {
        const suggested = inspection?.suggested || {};
        return Object.entries(suggested).find(([, value]) => Number(value) === Number(index))?.[0];
    };

    const renderCell = (value) => {
        if (value === null || value === undefined || value === "") {
            return <span className="text-gray-600">—</span>;
        }
        const text = String(value);
        return text.length > 40 ? `${text.slice(0, 40)}…` : text;
    };

    const toggleRow = (number) => {
        if (!number) {
            return;
        }
        setSkipRows((previous) =>
            previous.includes(number)
                ? previous.filter((value) => value !== number)
                : [...previous, number].sort((a, b) => a - b)
        );
    };

    const typedNumbers = useMemo(() => parseRowNumbers(typedRows), [typedRows]);

    const allSkipRows = useMemo(() => {
        const merged = [...new Set([...(skipRows || []), ...typedNumbers])];
        return merged.filter((n) => Number.isInteger(n) && n > 0).sort((a, b) => a - b);
    }, [skipRows, typedNumbers]);

    const totalRows = inspection?.row_count ?? 0;
    const willImport = Math.max(totalRows - allSkipRows.length, 0);

    // One table per end of the file, same shape, so both ends are tickable.
    const renderRowsTable = (rows, numbers, emptyText) => {
        if (!rows.length) {
            return <div className="px-3 py-2 text-xs text-gray-500">{emptyText}</div>;
        }
        return (
            <div className="max-h-64 overflow-auto rounded-2xl border border-gray-800">
                <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#1a1a2e]">
                        <tr>
                            <th className="whitespace-nowrap border-b border-gray-700 px-3 py-2 font-medium text-gray-200">
                                Row
                            </th>
                            {columns.map((column, index) => (
                                <th
                                    key={`head-${index}`}
                                    className="whitespace-nowrap border-b border-gray-700 px-3 py-2 font-medium text-gray-200"
                                >
                                    {column || `(column ${index + 1})`}
                                    {mapping[index] && (
                                        <div className="text-[10px] font-normal text-emerald-300">
                                            {FIELD_LABELS[mapping[index]]}
                                        </div>
                                    )}
                                </th>
                            ))}
                            <th className="whitespace-nowrap border-b border-gray-700 px-3 py-2 font-medium text-gray-200">
                                Import
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => {
                            const number = numbers[rowIndex] ?? null;
                            const leftOut = number !== null && allSkipRows.includes(number);
                            return (
                                <tr
                                    key={`row-${number ?? rowIndex}-${rowIndex}`}
                                    className={leftOut ? "bg-[#12121f] opacity-40" : "bg-[#12121f]"}
                                >
                                    <td className="whitespace-nowrap border-b border-gray-800 px-3 py-1.5 text-gray-500">
                                        {number ?? "—"}
                                    </td>
                                    {columns.map((_, cellIndex) => (
                                        <td
                                            key={`cell-${rowIndex}-${cellIndex}`}
                                            className={`whitespace-nowrap border-b border-gray-800 px-3 py-1.5 text-gray-300 ${
                                                leftOut ? "line-through" : ""
                                            }`}
                                        >
                                            {renderCell(row[cellIndex])}
                                        </td>
                                    ))}
                                    <td className="whitespace-nowrap border-b border-gray-800 px-3 py-1.5">
                                        <button
                                            type="button"
                                            onClick={() => toggleRow(number)}
                                            disabled={!number}
                                            className={
                                                leftOut
                                                    ? "rounded-full border border-gray-700 bg-[#1a1a2e] px-2 py-0.5 text-[10px] text-gray-300 hover:bg-[#252540]"
                                                    : "rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/25"
                                            }
                                        >
                                            {leftOut ? "Undo" : "Leave out"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="5xl"
            placement="top-center"
            scrollBehavior="inside"
            classNames={{
                base: "bg-[#0a0a0f]",
                content: "bg-[#0a0a0f]",
                closeButton: "text-gray-400 hover:bg-[#1a1a2e]",
            }}
        >
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <span className="text-white">Check the columns of your file</span>
                            <span className="text-xs font-normal text-gray-400">
                                This file does not follow the standard format, so tell us what each
                                column holds. We have filled in what we recognised: check it, fix
                                what is wrong and confirm. We will remember it for the next file
                                from the same source.
                            </span>
                        </ModalHeader>
                        <ModalBody>
                            {wasRemembered && (
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                                    We remembered the columns you confirmed last time for this file
                                    layout, so they are already filled in.
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span>
                                    File: <span className="text-gray-300">{inspection?.format?.toUpperCase()}</span>
                                </span>
                                <span>
                                    Movements: <span className="text-gray-300">{willImport}</span>
                                    {allSkipRows.length > 0 && (
                                        <span className="text-gray-500"> of {totalRows}</span>
                                    )}
                                </span>
                                <span>
                                    Columns: <span className="text-gray-300">{columns.length}</span>
                                </span>
                                <span>
                                    {headerRow
                                        ? <>Headers found on row <span className="text-gray-300">{headerRow}</span> of the file</>
                                        : <>No header row found: all rows are movements</>}
                                </span>
                            </div>

                            {/* One selector per column, on top, as in the screen he described. */}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {columns.map((column, index) => {
                                    const suggested = suggestedFor(index);
                                    const current = mapping[index] || "";
                                    return (
                                        <div key={`${column}-${index}`} className={BOX}>
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <span
                                                    className="truncate text-xs uppercase tracking-wider text-gray-500"
                                                    title={column}
                                                >
                                                    {column || `(column ${index + 1})`}
                                                </span>
                                                {suggested && (
                                                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                                                        detected
                                                    </span>
                                                )}
                                            </div>
                                            <Select
                                                aria-label={`What is the column ${column}`}
                                                size="sm"
                                                items={[
                                                    { key: "", label: "Ignore this column" },
                                                    ...Object.entries(FIELD_LABELS).map(([key, label]) => ({
                                                        key,
                                                        label,
                                                    })),
                                                ]}
                                                selectedKeys={[current]}
                                                onChange={(event) => setColumnField(index, event.target.value)}
                                                classNames={selectClassNames}
                                                renderValue={(items) =>
                                                    items.map((item) => (
                                                        <span key={item.key} className="text-sm text-white">
                                                            {item.key === ""
                                                                ? "Ignore this column"
                                                                : FIELD_LABELS[item.key]}
                                                        </span>
                                                    ))
                                                }
                                            >
                                                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                                            </Select>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* The account: a bank export carries no BudgetBee account. */}
                            {!hasAccountColumn && (
                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                                    <div className="mb-1 text-xs text-amber-300">
                                        This file does not say which account the movements belong to.
                                        Choose it here.
                                    </div>
                                    <Select
                                        aria-label="Account the movements belong to"
                                        placeholder="Select account"
                                        size="sm"
                                        items={accounts}
                                        selectedKeys={accountId ? [accountId] : []}
                                        onChange={(event) => setAccountId(event.target.value)}
                                        classNames={selectClassNames}
                                        renderValue={(items) =>
                                            items.map((item) => (
                                                <span key={item.key} className="text-sm text-white">
                                                    {item.data?.name}
                                                </span>
                                            ))
                                        }
                                    >
                                        {(account) => (
                                            <SelectItem key={account.id}>{account.name}</SelectItem>
                                        )}
                                    </Select>
                                </div>
                            )}

                            {/* Rows to leave out: the lines a bank adds around the
                                movements, which are not movements at all. */}
                            <div className="rounded-2xl border border-gray-800 bg-[#12121f] p-3">
                                <div className="text-sm text-white">Lines that are not movements</div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Bank files usually carry extra lines: the account holder, the
                                    balance, a note at the start or a total at the end. Press
                                    Leave out on the ones you do not want to import, and we will
                                    remember it for the next file of this same layout.
                                </div>

                                {rememberedRows && (
                                    <div className="mt-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                                        We came back with the lines you left out last time. Undo any
                                        of them if this file is different.
                                    </div>
                                )}

                                <div className="mt-3">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <span className={LABEL}>First rows of the file</span>
                                        {headerRow && headerRow > 1 && (
                                            <span className="text-[11px] text-gray-500">
                                                The {headerRow - 1} line(s) above the headers are left
                                                out already.
                                            </span>
                                        )}
                                    </div>
                                    {renderRowsTable(preview, previewNumbers, "No rows to show.")}
                                </div>

                                {tail.length > 0 && (
                                    <div className="mt-3">
                                        <div className={`mb-1 ${LABEL}`}>Last rows of the file</div>
                                        {renderRowsTable(tail, tailNumbers, "No rows to show.")}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                                    <div className="flex-1">
                                        <div className={`mb-1 ${LABEL}`}>
                                            Other rows to leave out
                                        </div>
                                        <input
                                            type="text"
                                            value={typedRows}
                                            onChange={(event) => setTypedRows(event.target.value)}
                                            placeholder="For example 6, 12, 215-216"
                                            className={`${BOX} w-full text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 focus:outline-none`}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400 sm:pb-2">
                                        {allSkipRows.length > 0 ? (
                                            <>
                                                <span className="text-amber-300">
                                                    {allSkipRows.length} line(s)
                                                </span>{" "}
                                                will not be imported:{" "}
                                                <span className="text-gray-300">
                                                    {allSkipRows.slice(0, 12).join(", ")}
                                                    {allSkipRows.length > 12 ? "…" : ""}
                                                </span>
                                            </>
                                        ) : (
                                            <>Every row of the file will be imported.</>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-800/50">
                            {errorMsg && <span className="mr-auto text-xs text-red-400">{errorMsg}</span>}
                            {missingRequired.length > 0 && (
                                <span className={errorMsg ? "text-xs text-amber-400" : "mr-auto text-xs text-amber-400"}>
                                    Still to map:{" "}
                                    {missingRequired.map((field) => FIELD_LABELS[field]).join(", ")}
                                </span>
                            )}
                            <Button
                                type="button"
                                variant="flat"
                                className="bg-[#1a1a2e] text-gray-300 hover:bg-[#2a2a3e]"
                                onPress={close}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="flat"
                                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                                isLoading={loading === "plain"}
                                isDisabled={missingRequired.length > 0 || needsAccount}
                                onPress={() => onConfirm(mapping, accountId, false, allSkipRows)}
                                startContent={
                                    loading !== "plain" && (
                                        <FontAwesomeIcon icon="fa-solid fa-check" />
                                    )
                                }
                            >
                                Upload
                            </Button>
                            <Button
                                type="button"
                                className="bg-green-500 text-white hover:bg-green-600"
                                isLoading={loading === "categorise"}
                                isDisabled={missingRequired.length > 0 || needsAccount}
                                onPress={() => onConfirm(mapping, accountId, true, allSkipRows)}
                                startContent={
                                    loading !== "categorise" && (
                                        <FontAwesomeIcon icon="fa-solid fa-wand-magic-sparkles" />
                                    )
                                }
                            >
                                Upload and categorise
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
