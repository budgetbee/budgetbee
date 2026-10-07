import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import numeral from "numeral";
import { useDisclosure } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Endpoints from "../../../Api/Endpoints";

import SettingsLayout from "../../layout/SettingsLayout";
import CategorySelect from "../../Components/CategorySelect";
import RecordsModal from "../../Components/Record/RecordsModal";
import groupRulesByCategory from "./groupRulesByCategory";

/**
 * Auto-categorisation.
 *
 * The categoriser runs on its own on every import and on every movement the
 * user creates. This screen shows what it is doing and lets the user help it:
 *
 *   1. Header + plain explanation of what the screen is for.
 *   2. How it decides, in order, in plain words.
 *   3. Summary cards.
 *   4. Categorise movements by text: search a word, see how many movements
 *      match (with examples), pick a category and apply it. That also creates
 *      a rule, so it keeps happening on its own.
 *   5. Rules grouped by category: one block per category (with its icon and
 *      colour) and inside it the words it reacts to, each saying whether it is
 *      yours or learned. With forty rules, one line per word is a wall.
 *
 * No technical wording: the user never sees operators or internal fields. The
 * amount is never used to match movements, and a movement with no usable text
 * is never guessed.
 */

const CHIPS = {
    manual: "bg-blue-500/10 text-blue-300 border-blue-500/25",
    learned: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    suggested: "bg-amber-500/10 text-amber-300 border-amber-500/25",
};

// Where each word comes from, written on its own line inside the category block.
const SOURCE_TAG = {
    manual: { label: "Yours", class: "text-blue-300" },
    learned: { label: "Learned", class: "text-emerald-300" },
    ai: { label: "AI", class: "text-sky-300" },
};

// The two views of the rules section.
const TAB = (active) =>
    `text-sm px-3 py-2 -mb-px border-b-2 ${
        active
            ? "text-white border-emerald-500"
            : "text-gray-500 border-transparent hover:text-gray-300"
    }`;

export default function CategoryRules() {
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [ignored, setIgnored] = useState([]);
    // What ignoring a suggestion did, in movements: it is not only a suggestion
    // that goes away.
    const [notice, setNotice] = useState(null);
    // Which view of the rules section is open: the rules, or what he said no to.
    const [tab, setTab] = useState("rules");
    const [summary, setSummary] = useState(null);
    const [categoryGroups, setCategoryGroups] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);

    // Search + categorise by text
    const [text, setText] = useState("");
    const [preview, setPreview] = useState(null);
    const [checking, setChecking] = useState(false);
    const [categoryId, setCategoryId] = useState("");
    const [applying, setApplying] = useState(false);
    const [result, setResult] = useState(null);

    // Which rule/suggestion has its category picker open
    const [editing, setEditing] = useState(null);
    // What is picked but NOT saved yet: picking a category never changes
    // anything on its own, there is a button for that.
    const [pendingCategoryId, setPendingCategoryId] = useState(null);

    // The movements behind a count, in the same modal the dashboard uses.
    const recordsModal = useDisclosure();
    const [modalTitle, setModalTitle] = useState(null);
    const [modalRecords, setModalRecords] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const searchTimer = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);

        const response = await Endpoints.getCategoryRules();

        if (!response?.error) {
            setRules(response.rules || []);
            setSummary(response.summary || null);
            setSuggestions((response.candidates || []).filter((candidate) => !candidate.has_rule));
            setIgnored(response.ignored || []);
        } else {
            setError("Could not load the categories.");
        }

        // The API sends the categories the user can pick: his own plus the ones
        // already used by his movements (the default ones ship with the app).
        const choices = response?.category_choices || [];
        if (choices.length > 0) {
            const groups = {};
            choices.forEach((choice) => {
                const group = choice.parent_name || "Other";
                if (!groups[group]) groups[group] = [];
                groups[group].push(choice);
            });

            setCategories(choices);
            setCategoryGroups(Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])));
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Live count: how many of your movements contain what you typed?
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);

        if (text.trim().length < 2) {
            setPreview(null);
            return;
        }

        searchTimer.current = setTimeout(async () => {
            setChecking(true);
            const response = await Endpoints.testCategoryRule({
                operator: "contains",
                value: text,
                match_field: "text",
                limit: 5000,
            });
            setChecking(false);
            if (!response?.error) setPreview(response);
        }, 400);

        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [text]);

    const categoryName = useCallback(
        (id) => categories.find((category) => category.id === id)?.name || null,
        [categories]
    );

    // A long list read word by word is a wall: one block per category, and
    // inside it its words with their counts.
    const allGroups = useMemo(() => groupRulesByCategory(rules, categoryName), [rules, categoryName]);

    const mixedCategories = preview && (preview.categories?.length || 0) > 1;

    const handleApply = async () => {
        if (!categoryId) {
            setError("Pick a category first.");
            return;
        }

        setApplying(true);
        const response = await Endpoints.applyCategoryRule({
            operator: "contains",
            value: text,
            match_field: "text",
            category_id: Number(categoryId),
        });
        setApplying(false);

        if (response?.error) {
            setError(response.error);
            return;
        }

        setError(null);
        setResult({
            applied: response.applied,
            value: response.value,
            category: categoryName(response.category_id) || "the chosen category",
        });
        setText("");
        setPreview(null);
        setCategoryId("");
        await load();
    };

    const handleConfirm = async (suggestion) => {
        const response = await Endpoints.saveCategoryRule({
            operator: "equals",
            value: suggestion.merchant_key,
            match_field: "merchant_key",
            category_id: suggestion.category_id,
        });

        if (response?.error) {
            setError(response.error);
            return;
        }

        await load();
    };

    // "Remove" disables the rule instead of deleting it: the learner still sees
    // it, so a rule the user removed can never come back on its own.
    const handleRemove = async (rule) => {
        await Endpoints.saveCategoryRule({ enabled: false }, rule.id);
        await load();
    };

    const handleChangeCategory = async (rule, newCategoryId) => {
        if (!newCategoryId) {
            return;
        }

        await Endpoints.saveCategoryRule({ category_id: Number(newCategoryId) }, rule.id);
        setEditing(null);
        setPendingCategoryId(null);
        await load();
    };

    // Turning a suggestion into a rule: same payload the picker used to send.
    // Only called from the button, never when a category is picked.
    const saveCandidateRule = async (candidate, categoryId) => {
        if (!categoryId) {
            return;
        }

        await Endpoints.saveCategoryRule({
            operator: "equals",
            value: candidate.merchant_key,
            match_field: "merchant_key",
            category_id: Number(categoryId),
        });
        setEditing(null);
        setPendingCategoryId(null);
        await load();
    };

    // Saying no: the merchant stops being suggested (and stops being learned on
    // its own). Its movements are still there, so nothing is lost.
    // Saying no to a suggestion also means "stop reading those words": the
    // movements that carried them come back keyed by what comes after (the shop),
    // so they are suggested one by one instead of as one group of shops that have
    // nothing to do with each other.
    const handleIgnore = async (suggestion) => {
        const response = await Endpoints.ignoreCategorySuggestion(suggestion.merchant_key);

        setEditing(null);
        setPendingCategoryId(null);
        setNotice({
            words: suggestion.merchant_key,
            moved: response?.moved ?? 0,
        });
        await load();
    };

    // Changed his mind: the merchant goes back to being suggestable (and
    // learnable).
    const handleRestore = async (suggestion) => {
        await Endpoints.restoreCategorySuggestion(suggestion.merchant_key);
        setNotice(null);
        await load();
    };

    // Open the movements behind a count ("27 movements", "5 movements
    // categorised like this") in the same modal the dashboard uses.
    const openMovements = async (title, payload) => {
        setModalTitle(title);
        setModalRecords([]);
        setModalLoading(true);
        recordsModal.onOpen();

        const response = await Endpoints.getCategoryRuleRecords(payload);

        setModalLoading(false);
        if (!response?.error) {
            setModalRecords(response.records || []);
        }
    };

    const plainSentence = (rule) => (
        <>
            When a movement {rule.operator === "equals" ? "is exactly" : "contains"}{" "}
            <span className="text-white font-medium">{rule.value}</span>
            <span className="text-gray-500"> it goes to </span>
            <span className="text-white font-medium">
                {rule.category_name || categoryName(rule.category_id) || "—"}
            </span>
        </>
    );

    // A suggestion waiting for the user's OK. Rules have their own block
    // renderer below (ruleGroupRow), this one is only for suggestions.
    const ruleRow = (rule, chipLabel, chipClass, subtitle) => (
        <div key={`s:${rule.merchant_key}-${rule.category_id}`} className="bg-[#12121f] rounded-2xl p-4 border border-gray-800 mb-2 break-inside-avoid">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm text-gray-400">{plainSentence({ ...rule, value: rule.merchant_key })}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${chipClass}`}>{chipLabel}</span>

                        {rule.matching_records > 0 ? (
                            <button
                                onClick={() =>
                                    openMovements(
                                        `Movements categorised like this in ${
                                            rule.category_name || "the suggested category"
                                        }`,
                                        {
                                            match_field: "merchant_key",
                                            operator: "equals",
                                            value: rule.merchant_key,
                                            category_id: rule.category_id,
                                        }
                                    )
                                }
                                className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-300 hover:bg-white/5 tabular-nums"
                            >
                                {rule.matching_records} {rule.matching_records === 1 ? "movement" : "movements"}{" "}
                                categorised like this
                            </button>
                        ) : null}

                        {subtitle ? <span>{subtitle}</span> : null}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => handleConfirm(rule)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => {
                            setPendingCategoryId(null);
                            setEditing(editing === `s:${rule.merchant_key}` ? null : `s:${rule.merchant_key}`);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5"
                    >
                        Change
                    </button>
                    <button
                        onClick={() => handleIgnore(rule)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:bg-white/5"
                    >
                        Ignore
                    </button>
                </div>
            </div>

            {/* Picking a category does nothing on its own: the button saves it. */}
            {editing === `s:${rule.merchant_key}` && (
                <div className="mt-3">
                    <CategorySelect
                        value={null}
                        onChange={setPendingCategoryId}
                        label={`Movements containing ${rule.merchant_key} go to`}
                    />

                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={() => saveCandidateRule(rule, pendingCategoryId)}
                            disabled={!pendingCategoryId}
                            className={`text-xs px-3 py-1.5 rounded-lg text-white ${
                                pendingCategoryId
                                    ? "bg-emerald-600 hover:bg-emerald-500"
                                    : "bg-gray-700 opacity-60 cursor-not-allowed"
                            }`}
                        >
                            {/* This button only saves the rule: it does not move a
                                single movement. It used to promise "Apply to these
                                N movements", which was not true. */}
                            Save this rule
                        </button>
                        <button
                            onClick={() => {
                                setEditing(null);
                                setPendingCategoryId(null);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // One block per category: the header says which category it is (with its
    // icon and colour) and how much it is doing, and inside go its words, one
    // per line, each saying whether it is yours or learned.
    const ruleGroupRow = (group) => (
        <div
            key={group.id}
            className="bg-[#12121f] rounded-2xl border border-gray-800 overflow-hidden mb-2 break-inside-avoid"
        >
            <div className="flex items-center gap-3 px-4 py-3">
                <span
                    className="flex items-center justify-center w-7 h-7 rounded-full text-xs text-white shrink-0"
                    style={{ backgroundColor: group.color }}
                >
                    <FontAwesomeIcon icon={group.icon} />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: group.color }}>
                        {group.name}
                    </div>
                    <div className="text-xs text-gray-500">
                        {group.rules.length} {group.rules.length === 1 ? "word" : "words"}
                        {group.caught > 0
                            ? ` · ${group.caught} movements caught`
                            : " · nothing caught yet"}
                        {group.mine > 0 && group.mine < group.rules.length
                            ? ` · ${group.mine} of them yours`
                            : ""}
                        {group.mine > 0 && group.mine === group.rules.length
                            ? " · all of them yours"
                            : ""}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-800/70">
                {group.rules.map((rule) => {
                    const tag = SOURCE_TAG[rule.source] || SOURCE_TAG.learned;

                    return (
                        <div
                            key={rule.id}
                            className="px-4 py-2 border-b border-gray-800/40 last:border-b-0"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-[10px] uppercase tracking-wide w-14 shrink-0 ${tag.class}`}
                                >
                                    {tag.label}
                                </span>

                                <span className="text-[10px] uppercase tracking-wide text-gray-600 w-14 shrink-0">
                                    {rule.operator === "equals" ? "exactly" : "contains"}
                                </span>

                                <span className="text-sm text-white truncate flex-1 min-w-0">
                                    {rule.value}
                                </span>

                                {rule.matching_records > 0 ? (
                                    <button
                                        onClick={() =>
                                            openMovements(
                                                `Movements in ${
                                                    rule.category_name || "this category"
                                                } that ${
                                                    rule.operator === "equals"
                                                        ? "are exactly"
                                                        : "contain"
                                                } ${rule.value}`,
                                                {
                                                    match_field: rule.match_field,
                                                    operator: rule.operator,
                                                    value: rule.value,
                                                    category_id: rule.category_id,
                                                }
                                            )
                                        }
                                        className="text-[11px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-300 hover:bg-white/5 tabular-nums shrink-0"
                                    >
                                        {rule.matching_records} movements
                                    </button>
                                ) : (
                                    <span className="text-[11px] text-gray-600 shrink-0 w-20 text-right">
                                        —
                                    </span>
                                )}

                                <button
                                    onClick={() => {
                                        setPendingCategoryId(null);
                                        setEditing(editing === rule.id ? null : rule.id);
                                    }}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5 shrink-0"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={() => handleRemove(rule)}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:bg-white/5 shrink-0"
                                >
                                    Remove
                                </button>

                                {/* Learned by the categoriser: "Remove" alone would
                                    only delete it, and the next file would learn it
                                    again. Ignoring says no to the words themselves. */}
                                {rule.source === "learned" && (
                                    <button
                                        onClick={() => handleIgnore({ merchant_key: rule.value })}
                                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:bg-white/5 shrink-0"
                                    >
                                        Ignore
                                    </button>
                                )}
                            </div>

                            {editing === rule.id && (
                                <div className="mt-2">
                                    <CategorySelect
                                        value={rule.category_id}
                                        onChange={setPendingCategoryId}
                                        label={`Movements ${
                                            rule.operator === "equals"
                                                ? "that are exactly"
                                                : "containing"
                                        } ${rule.value} go to`}
                                    />

                                    {/* Picking a category does not change the rule: this does. */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => handleChangeCategory(rule, pendingCategoryId)}
                                            disabled={!pendingCategoryId}
                                            className={`text-xs px-3 py-1.5 rounded-lg text-white ${
                                                pendingCategoryId
                                                    ? "bg-emerald-600 hover:bg-emerald-500"
                                                    : "bg-gray-700 opacity-60 cursor-not-allowed"
                                            }`}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditing(null);
                                                setPendingCategoryId(null);
                                            }}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // A suggestion the user said no to. Nothing was thrown away: it is here so
    // he can see it and put it back.
    const ignoredRow = (item) => (
        <div
            key={`i:${item.merchant_key}`}
            className="bg-[#12121f] rounded-2xl p-4 border border-gray-800 mb-2 break-inside-avoid"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm text-gray-400">
                        {plainSentence({ ...item, value: item.merchant_key })}
                    </div>

                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-500">
                            Ignored
                        </span>

                        <button
                            onClick={() =>
                                openMovements(
                                    `Movements categorised like this in ${
                                        item.category_name || "that category"
                                    }`,
                                    {
                                        match_field: "merchant_key",
                                        operator: "equals",
                                        value: item.merchant_key,
                                        category_id: item.category_id,
                                    }
                                )
                            }
                            className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-300 hover:bg-white/5 tabular-nums"
                        >
                            {item.matching_records} {item.matching_records === 1 ? "movement" : "movements"}{" "}
                            categorised like this
                        </button>

                        {item.ignored_at ? (
                            <span>ignored on {moment(item.ignored_at).format("D MMM YY")}</span>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => handleRestore(item)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5"
                    >
                        Put it back
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <SettingsLayout>
            <div className="p-4 sm:p-6 w-full text-gray-300">
                {/* 1. What this screen is */}
                <h1 className="text-xl font-semibold text-white">Auto-categorisation</h1>
                <p className="text-sm text-gray-400 mt-2">
                    Every movement that comes in is categorised on its own, reading the text the bank sends.
                    No AI is involved and the amount is never used to guess.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    Here you can see what it has learned, and also help it: search a word, categorise the
                    movements that contain it in one go, and it will keep doing that by itself from then on.
                </p>

                {/* 2. How it decides */}
                <div className="mt-5 bg-[#12121f] rounded-2xl p-4 border border-gray-800">
                    <div className="text-sm font-medium text-white mb-2">How it decides</div>
                    <ol className="text-sm text-gray-400 space-y-1">
                        <li>
                            <span className="text-gray-500">1.</span> It looks for a{" "}
                            <span className="text-white">rule you added</span>. If it finds one, that wins.
                        </li>
                        <li>
                            <span className="text-gray-500">2.</span> If not, a{" "}
                            <span className="text-white">rule it learned by itself</span> from your own
                            movements.
                        </li>
                        <li>
                            <span className="text-gray-500">3.</span> If not, your{" "}
                            <span className="text-white">history with that same merchant</span>: three
                            movements and 80% agreement.
                        </li>
                        <li>
                            <span className="text-gray-500">4.</span> If it knows nothing, the movement is{" "}
                            <span className="text-white">left without a category</span>. It is never guessed.
                        </li>
                    </ol>
                </div>

                {error && (
                    <div className="mt-4 text-sm rounded-xl px-4 py-3 border bg-red-500/10 text-red-400 border-red-500/30">
                        {error}
                    </div>
                )}

                {/* 3. Cards */}
                {summary && (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Rules applied", value: summary.rules },
                            { label: "Learned on its own", value: summary.learned },
                            { label: "Added by you", value: summary.manual },
                            { label: "Movements identified", value: summary.with_key },
                        ].map((item) => (
                            <div key={item.label} className="bg-[#12121f] rounded-2xl p-4 border border-gray-800">
                                <div className="text-xs uppercase tracking-wider text-gray-500">{item.label}</div>
                                <div className="text-2xl font-semibold text-white mt-1">{item.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Categorise by text */}
                <div className="mt-8 bg-[#12121f] rounded-2xl p-4 sm:p-5 border border-gray-800">
                    <div className="text-sm font-medium text-white">Categorise movements by text</div>
                    <p className="text-xs text-gray-500 mt-1">
                        Write something you know appears in the movement, and you will see how many of your
                        movements contain it. Then pick the category: it is applied to all of them and a rule
                        is created so it keeps happening by itself.
                    </p>

                    <input
                        value={text}
                        onChange={(event) => {
                            setText(event.target.value);
                            setResult(null);
                        }}
                        placeholder="supermarket"
                        className="mt-3 w-full bg-[#0a0a0f] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600"
                    />

                    <div className="mt-3 text-sm min-h-[22px]">
                        {text.trim().length < 2 ? (
                            <span className="text-gray-600">Write a word to search your movements.</span>
                        ) : checking ? (
                            <span className="text-gray-500">Searching your movements…</span>
                        ) : preview ? (
                            preview.matched > 0 ? (
                                <span className={mixedCategories ? "text-amber-400" : "text-emerald-400"}>
                                    <span className="font-semibold">{preview.matched}</span>{" "}
                                    {preview.matched === 1 ? "movement contains" : "movements contain"} it
                                    {preview.categories?.length === 1 &&
                                        ` · all of them already in ${preview.categories[0].category_name}`}
                                    {mixedCategories &&
                                        ` · they are spread over ${preview.categories.length} categories today`}
                                </span>
                            ) : (
                                <span className="text-gray-500">No movement contains that text.</span>
                            )
                        ) : null}
                    </div>

                    {/* Examples, so the user sees what he is about to change:
                        flat one-line rows, with the category icon and colour,
                        the date and the amount, like the movements list. */}
                    {preview?.matched > 0 && !result && (
                        <div className="mt-2 space-y-1">
                            {(preview.examples || []).map((example) => (
                                <div
                                    key={example.id}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03]"
                                >
                                    <span
                                        className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] text-white shrink-0"
                                        style={{ backgroundColor: example.category_color || "#374151" }}
                                    >
                                        <FontAwesomeIcon icon={example.icon || "fa-solid fa-tag"} />
                                    </span>

                                    <span className="text-xs text-gray-500 w-20 shrink-0">
                                        {moment(example.date).format("D MMM YY")}
                                    </span>

                                    <span className="text-xs text-gray-300 truncate flex-1 min-w-0">
                                        {example.text}
                                    </span>

                                    <span
                                        className="text-xs shrink-0 hidden sm:block"
                                        style={{ color: example.category_color || "#6b7280" }}
                                    >
                                        {example.category_name || "no category"}
                                    </span>

                                    <span
                                        className={`text-xs tabular-nums shrink-0 ${
                                            example.amount < 0 ? "text-red-400" : "text-emerald-400"
                                        }`}
                                    >
                                        {example.currency_symbol || "€"}{" "}
                                        {numeral(example.amount).format("0,0.00")}
                                    </span>
                                </div>
                            ))}
                            {preview.matched > (preview.examples || []).length && (
                                <div className="text-xs text-gray-600 pl-1">
                                    and {preview.matched - (preview.examples || []).length} more
                                </div>
                            )}
                        </div>
                    )}

                    {preview?.matched > 0 && !result && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                                <CategorySelect
                                    value={categoryId}
                                    onChange={(id) => setCategoryId(id)}
                                />
                            </div>
                            <button
                                onClick={handleApply}
                                disabled={!categoryId || applying}
                                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-sm text-white"
                            >
                                {applying
                                    ? "Categorising…"
                                    : `Categorise ${preview.matched} ${preview.matched === 1 ? "movement" : "movements"}`}
                            </button>
                        </div>
                    )}

                    {result && (
                        <div className="mt-4 rounded-xl px-4 py-3 border bg-emerald-500/10 border-emerald-500/30 text-sm text-emerald-300">
                            <div>
                                {result.applied} {result.applied === 1 ? "movement" : "movements"} categorised in{" "}
                                {result.category}.
                            </div>
                            <div className="text-xs text-emerald-400/80 mt-1">
                                A rule was created: whenever a movement contains {result.value} it will go to{" "}
                                {result.category}, automatically. You can change it below.
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="mt-6 text-sm text-gray-500">Loading…</div>
                ) : (
                    <>
                        {/* 5. Rules, grouped by category, and what he said no to
                            in its own tab. With a lot of rules, one line per word
                            is a wall (forty lines): the same category is one
                            block, and inside it go its words with their counts. */}
                        <div className="mt-8">
                            <div className="flex items-center gap-1 border-b border-gray-800">
                                <button onClick={() => setTab("rules")} className={TAB(tab === "rules")}>
                                    Rules
                                </button>
                                <button onClick={() => setTab("ignored")} className={TAB(tab === "ignored")}>
                                    Ignored{ignored.length > 0 ? ` (${ignored.length})` : ""}
                                </button>
                            </div>

                            {notice && (
                                <div className="mt-3 text-xs text-gray-400 bg-[#12121f] rounded-2xl p-3 border border-gray-800">
                                    “{notice.words}” is not read any more.{" "}
                                    {notice.moved > 0
                                        ? `${notice.moved} movements are now keyed by the shop that comes after it`
                                        : "No movement was keyed by it"}{" "}
                                    — they go back to being suggestions of their own.
                                </div>
                            )}

                            {tab === "ignored" ? (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-3">
                                        Words you said no to: they are not suggested, the categoriser does not
                                        apply them on its own, and they are not read any more when the shop is
                                        worked out — the words that come after them take their place. A bank
                                        writes them in every line, so this is the fastest way of telling it
                                        apart from a shop. Nothing was thrown away: those movements keep the
                                        category they have, and you can put one back.
                                    </p>

                                    {ignored.length === 0 ? (
                                        <div className="text-sm text-gray-500 bg-[#12121f] rounded-2xl p-4 border border-gray-800">
                                            You have not ignored any suggestion.
                                        </div>
                                    ) : (
                                        <div className="columns-1 xl:columns-2 gap-2">
                                            {ignored.map((item) => ignoredRow(item))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                            <div className="flex items-center gap-2 flex-wrap mt-4">
                                <div className="text-sm font-medium text-white">All rules</div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CHIPS.manual}`}>
                                    Added by you
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CHIPS.learned}`}>
                                    Learned by the categoriser
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 mb-3">
                                One block per category, with the words it reacts to inside and how many
                                movements each one has caught. The ones you added always win over the learned
                                ones.
                            </p>

                            {/* Pending suggestions first: they still need a hand. */}
                            {suggestions.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-2">
                                        Seen but still not applied on its own: give it your OK, change the
                                        category, or ignore it. Ignoring a wording that the bank writes in
                                        every line stops it being read, and the shop that comes after it
                                        becomes the suggestion.
                                    </p>
                                    <div className="columns-1 xl:columns-2 gap-2">
                                        {suggestions.slice(0, 10).map((suggestion) =>
                                            ruleRow(
                                                suggestion,
                                                "Suggested",
                                                CHIPS.suggested,
                                                suggestion.contradictions > 0
                                                    ? `${suggestion.contradictions} changed afterwards`
                                                    : ""
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {rules.length === 0 && suggestions.length === 0 ? (
                                <div className="text-sm text-gray-500 bg-[#12121f] rounded-2xl p-4 border border-gray-800">
                                    No rules yet. They are optional: the categoriser works without them, and
                                    the ones it learns appear here by themselves.
                                </div>
                            ) : (
                                rules.length > 0 && (
                                    <div className="columns-1 xl:columns-2 gap-2">
                                        {allGroups.map((group) => ruleGroupRow(group))}
                                    </div>
                                )
                            )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* The movements behind a count, in the modal the dashboard uses. */}
            <RecordsModal
                isOpen={recordsModal.isOpen}
                onOpenChange={recordsModal.onOpenChange}
                records={modalRecords}
                isLoading={modalLoading}
                title={modalTitle}
                emptyText="No movements found for this count."
            />
        </SettingsLayout>
    );
}