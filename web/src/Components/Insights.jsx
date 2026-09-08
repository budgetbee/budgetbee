import React, { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartLine,
    faArrowTrendUp,
    faBell,
    faTriangleExclamation,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Endpoints from "../Api/Endpoints";

const TYPE_META = {
    summary: { icon: faChartLine, color: "text-sky-400", bg: "bg-sky-500/15" },
    forecast: { icon: faArrowTrendUp, color: "text-emerald-400", bg: "bg-emerald-500/15" },
    subscriptions: { icon: faBell, color: "text-amber-400", bg: "bg-amber-500/15" },
    increase: { icon: faTriangleExclamation, color: "text-red-400", bg: "bg-red-500/15" },
};

export default function Insights({ variant = "desktop", refreshKey = 0 }) {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await Endpoints.getInsights();
            setInsights(Array.isArray(data) ? data : []);
        } catch (e) {
            setInsights([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    if (loading) {
        return null; // keep the dashboard clean while loading
    }

    if (insights.length === 0) {
        return null; // nothing to show — do not occupy space
    }

    const cardClass =
        variant === "mobile"
            ? "bg-neutral-900 border border-white/10"
            : "bg-white border border-gray-200 shadow-sm";

    const textClass = variant === "mobile" ? "text-white" : "text-gray-800";
    const subTextClass = variant === "mobile" ? "text-neutral-400" : "text-gray-500";

    const handleDismiss = async (e, id) => {
        e.stopPropagation();
        setInsights((prev) => prev.filter((i) => i.id !== id));
        try {
            await Endpoints.dismissInsight(id);
        } catch (err) {
            // silent — the card is already gone locally
        }
    };

    const handleOpen = async (insight) => {
        if (!insight.read_at) {
            setInsights((prev) =>
                prev.map((i) => (i.id === insight.id ? { ...i, read_at: new Date().toISOString() } : i))
            );
            try {
                await Endpoints.markInsightRead(insight.id);
            } catch (err) {
                // silent
            }
        }
    };

    return (
        <div className="flex flex-col gap-y-3 w-full">
            <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                    variant === "mobile" ? "text-neutral-400 px-1" : "text-gray-400"
                }`}
            >
                Your insights
            </p>
            {insights.map((insight) => {
                const meta = TYPE_META[insight.type] || TYPE_META.summary;
                const unread = !insight.read_at;
                return (
                    <div
                        key={insight.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpen(insight)}
                        className={`${cardClass} rounded-xl px-4 py-3 text-left flex flex-row gap-x-3 items-start transition cursor-pointer ${
                            unread ? "" : "opacity-70"
                        } hover:opacity-100 ${variant === "mobile" ? "" : "hover:border-gray-300"}`}
                    >
                        <span
                            className={`${meta.bg} ${meta.color} w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5`}
                        >
                            <FontAwesomeIcon icon={meta.icon} />
                        </span>
                        <span className="flex flex-col gap-y-0.5 min-w-0 grow">
                            <span className={`text-sm font-semibold ${textClass}`}>
                                {insight.title}
                                {unread && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-sky-400 ml-2 align-middle" />
                                )}
                            </span>
                            <span className={`text-xs whitespace-pre-line leading-relaxed ${subTextClass}`}>
                                {insight.body}
                            </span>
                        </span>
                        <button
                            type="button"
                            aria-label="Dismiss insight"
                            onClick={(e) => handleDismiss(e, insight.id)}
                            className={`shrink-0 mt-1 px-1.5 py-0.5 rounded-md ${
                                variant === "mobile" ? "text-neutral-500 hover:text-white" : "text-gray-300 hover:text-gray-600"
                            }`}
                        >
                            <FontAwesomeIcon icon={faXmark} size="xs" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
