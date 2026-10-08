import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";

const DATE_PRESETS = [
    { key: "this_month", label: "This month", from: () => moment().startOf("month"), to: () => moment() },
    { key: "last_month", label: "Last month", from: () => moment().subtract(1, "month").startOf("month"), to: () => moment().subtract(1, "month").endOf("month") },
    { key: "this_year", label: "This year", from: () => moment().startOf("year"), to: () => moment() },
    { key: "last_30_days", label: "Last 30 days", from: () => moment().subtract(30, "days"), to: () => moment() },
];

/**
 * The top bar of the dashboard.
 *
 * It keeps the same contract as before — it receives setSearchData and writes
 * { from_date, to_date, ... } onto it — and adds the period shortcuts, the
 * search box and the button that opens the full filter. It is the only place
 * the range is chosen, so every panel reads the same from_date / to_date.
 */
export default function TopNav({
    searchData,
    setSearchData,
    activeFilterCount = 0,
    filtersOpen = false,
    onToggleFilters,
}) {
    const applyPreset = (preset) => {
        setSearchData((prev) => ({
            ...prev,
            from_date: preset.from().format("YYYY-MM-DD"),
            to_date: preset.to().format("YYYY-MM-DD"),
            _refresh: Date.now(),
        }));
    };

    const handleSearchForm = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formObject = Object.fromEntries(formData.entries());
        setSearchData((prev) => {
            const next = { ...prev, ...formObject, _refresh: Date.now() };
            if (!formObject.search_term) {
                delete next.search_term;
            }
            return next;
        });
    };

    const fromLabel = searchData?.from_date
        ? moment(searchData.from_date).format("D MMM YYYY")
        : "All time";
    const toLabel = searchData?.to_date
        ? moment(searchData.to_date).format("D MMM YYYY")
        : moment().format("D MMM YYYY");

    return (
        <div className="flex flex-col gap-4 px-10 pt-6 pb-4">
            <div className="flex flex-row items-center justify-between gap-x-4">
                <div className="flex items-center gap-x-4 min-w-0">
                    <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xl shrink-0">
                        <FontAwesomeIcon icon="fa-solid fa-gauge-high" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
                        <p className="text-xs text-gray-500">
                            {fromLabel} &mdash; {toLabel}
                        </p>
                    </div>
                </div>

            </div>

            <div className="flex flex-row flex-wrap items-center gap-2">
                <span className="mr-1 flex items-center gap-x-2 text-xs uppercase tracking-wider text-gray-500">
                    <FontAwesomeIcon icon="fa-solid fa-calendar-days" />
                    Period
                </span>
                {DATE_PRESETS.map((preset) => {
                    const isActive =
                        searchData?.from_date === preset.from().format("YYYY-MM-DD") &&
                        searchData?.to_date === preset.to().format("YYYY-MM-DD");
                    return (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                                isActive
                                    ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                                    : "border-gray-700 bg-[#2c3a50] text-gray-300 hover:text-white"
                            }`}
                        >
                            {preset.label}
                        </button>
                    );
                })}

                <form
                    key={searchData?.search_term ?? ""}
                    onSubmit={handleSearchForm}
                    className="ml-auto flex items-center gap-x-2"
                >
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="text-sm" />
                        </span>
                        <input
                            type="search"
                            name="search_term"
                            defaultValue={searchData?.search_term ?? ""}
                            placeholder="Search movements"
                            className="w-72 rounded-2xl border border-gray-700 bg-[#2c3a50] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:border-emerald-500/40 focus:outline-none transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="flex h-10 items-center gap-x-2 rounded-2xl bg-green-500 px-4 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                    >
                        Search
                    </button>
                </form>

                <button
                    type="button"
                    onClick={onToggleFilters}
                    className={`ml-2 flex h-10 items-center gap-x-2 rounded-2xl border px-4 text-sm transition-colors ${
                        filtersOpen
                            ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                            : "border-gray-700 bg-[#2c3a50] text-gray-300 hover:text-white"
                    }`}
                >
                    <FontAwesomeIcon icon="fa-solid fa-filter" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-xs font-semibold text-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
