import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * The one card of the desktop dashboard.
 *
 * Every panel on the screen is wrapped in exactly this shell, so the whole
 * dashboard speaks the same visual language: a rounded panel with a soft grey
 * border, a coloured icon badge and a title. Hierarchy comes from the size of
 * the numbers and the colour of the badge, never from heavy lines. The tones
 * follow the same meaning everywhere: emerald is the highlighted or learned
 * thing, blue is the user's own, amber is a warning.
 */
export default function DashboardCard({
    title,
    icon = "fa-solid fa-chart-simple",
    tone = "emerald",
    subtitle,
    action,
    children,
    className = "",
}) {
    const tones = {
        emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
        blue: "bg-blue-500/15 border-blue-500/25 text-blue-300",
        amber: "bg-amber-500/15 border-amber-500/25 text-amber-300",
    };

    return (
        <section
            className={`rounded-2xl border border-gray-800 bg-[#12121f] p-4 sm:p-5 ${className}`}
        >
            {(title || action) && (
                <header className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <span
                            className={`flex items-center justify-center w-12 h-12 rounded-2xl border text-xl shrink-0 ${
                                tones[tone] || tones.emerald
                            }`}
                        >
                            <FontAwesomeIcon icon={icon} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-white truncate">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}
