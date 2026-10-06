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

// The three things every bank export carries, and the only ones this screen
// asks for. A file that also brings accounts, category or type is a file that
// already follows the downloadable template, and those import straight away
// without being asked anything, so offering those columns here would only
// invite mistakes.
const FIELD_LABELS = {
    date: "Date",
    name: "Description",
    amount: "Amount",
};

const REQUIRED_FIELDS = ["date", "name", "amount"];

// Field box, label and dropdown, copied from the record modal so this screen
// is the same screen as the rest of the app: the app is a dark theme painted
// by hand, and a NextUI default (light) background makes this unreadable.
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

// The account dropdown, copied verbatim from Desktop/Components/Record/FormModal.jsx
// (same trigger height, same coloured box, same balance on the right) so picking
// an account here is the same gesture as picking it in the record form.
const ACCOUNT_SELECT_CLASSNAMES = {
    base: "w-full",
    trigger:
        "bg-transparent shadow-none border-0 h-auto min-h-[36px] py-1.5 px-0 data-[hover=true]:!bg-transparent data-[hover=true]:opacity-80",
    innerWrapper: "pt-0",
    value: "text-white font-medium text-sm",
    listbox:
        "bg-[#1a1a2e] text-white [&_li]:data-[hover=true]:!bg-[#252540] [&_li]:data-[hover=true]:!text-white",
    popoverContent: "bg-[#1a1a2e] border border-gray-700 text-white",
};

// A card like the ones the rest of the app uses for a field: dark, rounded and
// with the label in small caps. No warning colours: nothing here is broken.
const CARD = "bg-[#1a1a2e] rounded-2xl p-3 border border-gray-800";

// The dropdown that lives in a column header: this is where the user says what
// the column holds, on the table itself instead of in a list above it.
const HEADER_SELECT_CLASSNAMES = {
    ...selectClassNames,
    base: "w-[150px]",
    trigger:
        "bg-[#12121f] border border-gray-700 rounded-xl h-auto min-h-[30px] px-2 py-1 data-[hover=true]:!bg-[#1a1a2e]",
    value: "text-white font-medium text-xs",
};

export default function ColumnMappingModal({
    isOpen,
    onClose,
    inspection,
    loading,
    errorMsg,
    onConfirm,
    onReinspect,
    inspecting,
}) {
    // field name -> column index, the shape the API and a saved mapping use
    // ("" or absent = that column is ignored)
    const [mapping, setMapping] = useState({});
    const [accountId, setAccountId] = useState("");
    const [accounts, setAccounts] = useState([]);
    const [wasRemembered, setWasRemembered] = useState(false);
    // Rows the user does not want imported, numbered as they are in the file.
    const [skipRows, setSkipRows] = useState([]);
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
        // Only the columns this screen asks for: a remembered mapping may name
        // others, and they would show as a dropdown with nothing selected.
        setMapping(
            Object.fromEntries(
                Object.entries(source).filter(([field]) => FIELD_LABELS[field])
            )
        );
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
    }, [inspection]);

    const columns = inspection?.columns || [];
    const preview = inspection?.preview || [];
    const previewNumbers = inspection?.preview_row_numbers || [];
    const headerRow = inspection?.header_row || null;

    // The dropdown of a column shows the field that column holds.
    const fieldForColumn = (index) =>
        Object.entries(mapping).find(([, columnIndex]) => Number(columnIndex) === Number(index))?.[0] || "";

    const mappedFields = useMemo(() => Object.keys(mapping), [mapping]);

    const missingRequired = REQUIRED_FIELDS.filter(
        (field) => !mappedFields.includes(field)
    );

    // This screen only appears for a file that does not follow the template, so
    // the account is never in the file: the user always has to pick it here,
    // otherwise the movements cannot be stored.
    const needsAccount = !accountId;

    const selectedAccount = accounts.find(
        (account) => String(account.id) === String(accountId)
    );

    const setColumnField = (index, field) => {
        setMapping((previous) => {
            const next = { ...previous };
            // A column holds at most one field: clear whatever this column had.
            Object.keys(next).forEach((key) => {
                if (Number(next[key]) === Number(index)) {
                    delete next[key];
                }
            });
            // A field lives in one column: this also takes it away from the
            // column it was in before.
            if (field) {
                next[field] = index;
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

    const allSkipRows = useMemo(
        () =>
            (skipRows || [])
                .filter((n) => Number.isInteger(n) && n > 0)
                .sort((a, b) => a - b),
        [skipRows]
    );

    const totalRows = inspection?.row_count ?? 0;
    const willImport = Math.max(totalRows - allSkipRows.length, 0);

    // "This row is the header": everything above it is left out and the file is
    // read again, so the table is rebuilt with the headers where the user says.
    // It is the way out when the automatic search picks the wrong row.
    const useAsHeader = (number) => {
        if (!number || !onReinspect) {
            return;
        }
        const above = Array.from({ length: number - 1 }, (_, index) => index + 1);
        const next = [...new Set([...allSkipRows, ...above])]
            .filter((n) => Number.isInteger(n) && n > 0 && n < number)
            .sort((a, b) => a - b);
        setSkipRows(next);
        onReinspect(next);
    };

    // One table, one row per line of the file, so every line is tickable.
    // The header of every column is a dropdown: the user reads the table and
    // says, right there, what each column holds.
    const renderRowsTable = (rows, numbers, emptyText) => {
        if (!rows.length) {
            return <div className="px-3 py-2 text-xs text-gray-500">{emptyText}</div>;
        }
        return (
            <div className="max-h-96 overflow-auto rounded-2xl border border-gray-800">
                <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[#1a1a2e]">
                        <tr>
                            <th className="whitespace-nowrap border-b border-gray-700 px-3 py-2 align-top font-medium text-gray-200">
                                Row
                            </th>
                            {columns.map((column, index) => {
                                const current = fieldForColumn(index);
                                const suggested = suggestedFor(index);
                                // The column holds what we found for it by itself.
                                const isDetected = Boolean(current) && current === suggested;
                                return (
                                    <th
                                        key={`head-${index}`}
                                        className="border-b border-gray-700 px-2 py-2 align-top font-medium text-gray-200"
                                    >
                                        <div
                                            className="mb-1 flex items-center gap-1 truncate text-[11px] text-gray-400"
                                            title={column}
                                        >
                                            <span className="truncate">
                                                {column || `(column ${index + 1})`}
                                            </span>
                                            {isDetected && (
                                                <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 text-[9px] text-emerald-300">
                                                    detected
                                                </span>
                                            )}
                                        </div>
                                        <Select
                                            aria-label={`What is the column ${column || index + 1}`}
                                            size="sm"
                                            items={[
                                                { key: "", label: "Ignore this column" },
                                                ...Object.entries(FIELD_LABELS).map(([key, label]) => ({
                                                    key,
                                                    label,
                                                })),
                                            ]}
                                            selectedKeys={[current]}
                                            onChange={(event) =>
                                                setColumnField(index, event.target.value)
                                            }
                                            classNames={{
                                                ...HEADER_SELECT_CLASSNAMES,
                                                trigger: `${HEADER_SELECT_CLASSNAMES.trigger} ${
                                                    current
                                                        ? "!border-emerald-500/40"
                                                        : "!border-gray-700"
                                                }`,
                                            }}
                                            renderValue={(items) =>
                                                items.map((item) => (
                                                    <span
                                                        key={item.key}
                                                        className={`text-xs ${
                                                            item.key === ""
                                                                ? "text-gray-500"
                                                                : "text-emerald-300"
                                                        }`}
                                                    >
                                                        {item.key === ""
                                                            ? "Ignore this column"
                                                            : FIELD_LABELS[item.key]}
                                                    </span>
                                                ))
                                            }
                                        >
                                            {(item) => (
                                                <SelectItem key={item.key}>{item.label}</SelectItem>
                                            )}
                                        </Select>
                                    </th>
                                );
                            })}
                            <th className="whitespace-nowrap border-b border-gray-700 px-3 py-2 align-top font-medium text-gray-200">
                                Import
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => {
                            const number = numbers[rowIndex] ?? null;
                            const leftOut = number !== null && allSkipRows.includes(number);
                            const isHeader = number !== null && number === headerRow;
                            return (
                                <tr
                                    key={`row-${number ?? rowIndex}-${rowIndex}`}
                                    className={
                                        isHeader
                                            ? "bg-emerald-500/10"
                                            : leftOut
                                            ? "bg-[#12121f] opacity-40"
                                            : "bg-[#12121f]"
                                    }
                                >
                                    <td className="whitespace-nowrap border-b border-gray-800 px-3 py-1.5 text-gray-500">
                                        {number ?? "—"}
                                    </td>
                                    {columns.map((_, cellIndex) => (
                                        <td
                                            key={`cell-${rowIndex}-${cellIndex}`}
                                            className={`max-w-[160px] truncate border-b border-gray-800 px-3 py-1.5 text-gray-300 ${
                                                leftOut ? "line-through" : ""
                                            }`}
                                            title={row[cellIndex] === null || row[cellIndex] === undefined ? "" : String(row[cellIndex])}
                                        >
                                            {renderCell(row[cellIndex])}
                                        </td>
                                    ))}
                                    <td className="whitespace-nowrap border-b border-gray-800 px-3 py-1.5">
                                        <div className="flex items-center gap-1 whitespace-nowrap">
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
                                            {isHeader ? (
                                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                                                    Header
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => useAsHeader(number)}
                                                    disabled={!number || !onReinspect || inspecting}
                                                    className="rounded-full border border-gray-700 bg-[#1a1a2e] px-2 py-0.5 text-[10px] text-gray-300 hover:bg-[#252540] disabled:opacity-40"
                                                    title="Use this row as the header of the table"
                                                >
                                                    Use as header
                                                </button>
                                            )}
                                        </div>
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
                            <span className="text-white">Check your file</span>
                            <span className="text-xs font-normal text-gray-400">
                                This file does not follow the standard format. We have looked for the
                                header row and matched the columns by their names: what is in green has
                                been filled in for you. Below, in the table, say what each column holds
                                by clicking its header. We will remember it for the next file from the
                                same source.
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
                                    {headerRow ? (
                                        <>
                                            Header on row{" "}
                                            <span className="text-gray-300">{headerRow}</span>
                                        </>
                                    ) : (
                                        <>No header row found: all rows are movements</>
                                    )}
                                </span>
                            </div>

                            {missingRequired.length > 0 && (
                                <div className={`${CARD} text-xs text-gray-300`}>
                                    Still to match, click the header of the column that holds it:{" "}
                                    {missingRequired.map((field) => FIELD_LABELS[field]).join(", ")}
                                </div>
                            )}

                            {/* The account: this file does not say which one the
                                movements belong to. */}
                            <div className={CARD}>
                                <div className={`${LABEL} mb-1`}>Account</div>
                                <div className="mb-2 text-xs text-gray-500">
                                    This file does not say which account the movements belong to.
                                </div>
                                <Select
                                    aria-label="Account the movements belong to"
                                    placeholder="Select account"
                                    size="sm"
                                    items={accounts}
                                    selectionMode="single"
                                    selectedKeys={accountId ? [accountId.toString()] : []}
                                    onChange={(event) => setAccountId(event.target.value)}
                                    classNames={ACCOUNT_SELECT_CLASSNAMES}
                                    renderValue={() => (
                                        <div className="flex flex-row items-center gap-x-2">
                                            {selectedAccount && (
                                                <>
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: selectedAccount.color || "#666" }}>
                                                        {selectedAccount.name.charAt(0)}
                                                    </div>
                                                    <span className="text-white text-sm">{selectedAccount.name}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                >
                                    {(item) => (
                                        <SelectItem key={item.id} value={item.id}
                                            startContent={
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: item.color || "#666" }}>
                                                    {item.name.charAt(0)}
                                                </div>
                                            }
                                            endContent={
                                                <span className="text-gray-400 text-xs">{item.currency_symbol} {item.balance}</span>
                                            }
                                        >
                                            {item.name}
                                        </SelectItem>
                                    )}
                                </Select>
                            </div>

                            {/* The table: the headers carry the dropdowns, and every
                                row can be left out or taken as the header. */}
                            <div className="rounded-2xl border border-gray-800 bg-[#12121f] p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm text-white">Your file, as we read it</div>
                                    {inspecting && (
                                        <span className="text-xs text-gray-400">Reading the file…</span>
                                    )}
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Click the header of each column and say what it holds. If we took
                                    the wrong row as the header, press {" "}
                                    <span className="text-gray-200">Use as header</span> on the right
                                    row and the table is built again. The lines a bank adds around the
                                    movements (the holder, the balance, a total) can be left out with{" "}
                                    <span className="text-gray-200">Leave out</span>: they are the ones
                                    with a dash through them.
                                </div>

                                {rememberedRows && (
                                    <div className="mt-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                                        We came back with the lines you left out last time. Undo any
                                        of them if this file is different.
                                    </div>
                                )}

                                <div className="mt-3 overflow-x-auto">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <span className={LABEL}>First rows of the file</span>
                                        {headerRow && headerRow > 1 && (
                                            <span className="text-[11px] text-gray-500">
                                                The {headerRow - 1} line(s) above the header are left
                                                out already.
                                            </span>
                                        )}
                                    </div>
                                    {renderRowsTable(preview, previewNumbers, "No rows to show.")}
                                </div>

                                <div className="mt-3 text-xs text-gray-400">
                                    {allSkipRows.length > 0 ? (
                                        <>
                                            <span className="text-gray-200">
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
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-800/50">
                            {errorMsg && <span className="mr-auto text-xs text-red-400">{errorMsg}</span>}
                            {missingRequired.length === 0 && needsAccount && (
                                <span className="mr-auto text-xs text-gray-400">
                                    Choose the account the movements belong to.
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
                            {/* One button only: every import is categorised, so
                                there is nothing to choose here. */}
                            <Button
                                type="button"
                                className="bg-green-500 text-white hover:bg-green-600"
                                isLoading={Boolean(loading)}
                                isDisabled={missingRequired.length > 0 || needsAccount}
                                onPress={() => onConfirm(mapping, accountId, true, allSkipRows)}
                                startContent={
                                    !loading && (
                                        <FontAwesomeIcon icon="fa-solid fa-cloud-arrow-up" />
                                    )
                                }
                            >
                                Upload
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
