import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

/**
 * What the auto-categoriser knows right now, straight from its preferences
 * endpoint: how many rules it holds, how many suggestions are waiting for the
 * user, and how many movements it could not identify (no readable key). The
 * switch state comes from the same answer, so the card never lies about it.
 */
export default function CategorizerStatusCard() {
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        Api.getCategorizationPreferences().then((response) => {
            if (!cancelled && response && !response.error) {
                setData(response);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const stats = data?.stats || {};

    const rows = [
        { key: "rules", label: "Rules", icon: "fa-solid fa-sliders", value: stats.rules },
        { key: "suggestions", label: "Suggestions waiting", icon: "fa-solid fa-lightbulb", value: stats.suggestions },
        { key: "unidentified", label: "Not identified", icon: "fa-solid fa-circle-question", value: stats.without_key },
    ];

    return (
        <DashboardCard
            title="Auto-categoriser"
            icon="fa-solid fa-wand-magic-sparkles"
            tone="emerald"
            subtitle={
                data ? (data.enabled ? "Turned on" : "Turned off") : "Loading..."
            }
            className="h-full"
        >
            <div className="mt-3 flex flex-col">
                {rows.map((row) => (
                    <div
                        key={row.key}
                        className="flex items-center justify-between gap-3 py-3 border-t border-white/5 first:border-t-0"
                    >
                        <span className="flex items-center gap-3 text-sm text-gray-400">
                            <FontAwesomeIcon
                                icon={row.icon}
                                className="w-4 text-emerald-300/80"
                            />
                            {row.label}
                        </span>
                        <span className="text-lg font-semibold text-white">
                            {row.value ?? "\u2014"}
                        </span>
                    </div>
                ))}
            </div>
            <Link
                to="/settings/category-rules"
                className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200"
            >
                Open auto-categorisation
                <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
            </Link>
        </DashboardCard>
    );
}
