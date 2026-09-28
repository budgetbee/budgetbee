import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import Api from "../Api/Endpoints";

/**
 * One time notice after the income/expense detection changed.
 *
 * Parent categories are typed now (income / expense / transfer) and every
 * chart, report and balance decides from that flag. On an installation coming
 * from an older version the flag is on the default, so the user is told once
 * what changed, offered the categories that look like income (by seeded name or
 * by the records inside them, which they can untick) and given a way to review
 * them by hand.
 *
 * Both the notice and the short tour of the category screen are shown from this
 * single component, so mobile and desktop stay in sync.
 */
const AUTH_PATHS = ["/login", "/register", "/setup"];
const CATEGORY_LIST_PATH = "/category/list";

export default function CategoryTypesIntro() {
    const location = useLocation();
    const navigate = useNavigate();

    const [data, setData] = React.useState(null);
    const [selected, setSelected] = React.useState([]);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (!Api.isAuthenticated()) {
            return;
        }

        let cancelled = false;

        Api.getCategoryTypeSuggestions()
            .then((response) => {
                if (cancelled || !response || response.error) {
                    return;
                }
                setData(response);
                setSelected((response.suggestions || []).map((s) => s.id));
            })
            .catch(() => {
                // The notice is a convenience: it must never break the app.
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (!data) {
        return null;
    }

    const onAuthPath = AUTH_PATHS.some((path) => location.pathname.startsWith(path));
    const showIntro = Boolean(data.should_prompt) && !onAuthPath;
    const showTour =
        !showIntro &&
        !data.tour_seen &&
        location.pathname.startsWith(CATEGORY_LIST_PATH);

    if (!showIntro && !showTour) {
        return null;
    }

    function toggle(id) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
        );
    }

    function reasonLabel(suggestion) {
        if (suggestion.reason === "name") {
            return "Its name matches the income category";
        }

        return `${suggestion.income_records} income records, ${suggestion.expense_records} expenses`;
    }

    async function accept() {
        setSaving(true);
        try {
            await Api.acceptCategoryTypeSuggestions(selected);
        } catch (error) {
            // Nothing to do: the notice is dismissed locally either way.
        }
        setSaving(false);
        setData((prev) => ({ ...prev, should_prompt: false }));
    }

    async function dismiss() {
        try {
            await Api.dismissCategoryTypeSuggestions();
        } catch (error) {
            // See above.
        }
        setData((prev) => ({ ...prev, should_prompt: false }));
    }

    async function reviewMyself() {
        await dismiss();
        navigate(CATEGORY_LIST_PATH);
    }

    async function markTourSeen() {
        try {
            await Api.markCategoryTypesTourSeen();
        } catch (error) {
            // See above.
        }
        setData((prev) => ({ ...prev, tour_seen: true }));
    }

    if (showTour) {
        return (
            <Shell>
                <h3 className="text-white font-semibold text-lg mb-2">
                    How to mark a category as income or expense
                </h3>

                <p className="text-gray-300 text-sm leading-relaxed">
                    Every parent category has a type. The ones marked as income group your income,
                    the rest group your expenses, and transfers are kept apart. This is what all your
                    charts, reports and balances use.
                </p>

                <p className="text-gray-300 text-sm leading-relaxed mt-2">
                    To change one, open the parent category and set its type. You can also create new
                    parent categories for income from now on.
                </p>

                <button
                    onClick={markTourSeen}
                    className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl py-3 transition-colors"
                >
                    Got it
                </button>
            </Shell>
        );
    }

    const suggestions = data.suggestions || [];

    return (
        <Shell>
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-white font-semibold text-lg pr-2">
                    Income and expense categories: what changed
                </h3>
                <button
                    onClick={dismiss}
                    aria-label="Close"
                    className="text-gray-400 hover:text-white px-1 shrink-0"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
                BudgetBee now keeps <span className="text-white font-medium">income</span> and{" "}
                <span className="text-white font-medium">expense</span> parent categories apart, so you
                can create as many of each as you need. Every chart, report and balance decides which
                is which from a type set on the category.
            </p>

            <p className="text-gray-300 text-sm leading-relaxed mt-2">
                Your categories were created before that type existed, so right now they are all
                treated as expenses and your income can show up on the expense side. We have looked at
                your categories and your records, and these are the ones that look like income:
            </p>

            {suggestions.length > 0 ? (
                <div className="mt-4 space-y-2">
                    {suggestions.map((suggestion) => {
                        const checked = selected.includes(suggestion.id);

                        return (
                            <label
                                key={suggestion.id}
                                className={`flex items-center gap-3 bg-[#12121f] border rounded-xl px-3 py-3 cursor-pointer transition-colors ${
                                    checked ? "border-blue-500" : "border-gray-700 hover:border-gray-500"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(suggestion.id)}
                                    className="w-4 h-4 accent-blue-600 shrink-0"
                                />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-white text-sm truncate">
                                        {suggestion.name}
                                    </span>
                                    <span className="block text-gray-500 text-xs">
                                        {reasonLabel(suggestion)}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            ) : (
                <p className="mt-4 text-gray-400 text-sm">
                    We could not find a category that clearly looks like income in your data. You can
                    mark them yourself in the categories screen.
                </p>
            )}

            <button
                onClick={accept}
                disabled={saving}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
            >
                <FontAwesomeIcon icon={faCheck} />
                {selected.length > 0 ? `Mark as income (${selected.length})` : "Continue"}
            </button>

            <button
                onClick={reviewMyself}
                className="mt-2 w-full bg-transparent border border-gray-700 hover:border-gray-500 text-gray-300 rounded-xl py-3 text-sm transition-colors"
            >
                Review my categories myself
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>

            <p className="mt-3 text-gray-500 text-xs text-center">
                You can change this any time in the categories screen.
            </p>
        </Shell>
    );
}

function Shell({ children }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full sm:w-[560px] bg-[#1a1a2b] border-t sm:border border-gray-700 rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom),1.25rem)]">
                {children}
            </div>
        </div>
    );
}
