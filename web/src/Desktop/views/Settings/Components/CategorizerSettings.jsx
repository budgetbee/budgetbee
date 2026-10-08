import React, { useCallback, useEffect, useState } from "react";
import { Button, Switch } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";

/**
 * The two auto-categoriser controls, on the screen where the category rules
 * already live:
 *
 *   1. A switch to turn the auto-categoriser on or off. It is off by default.
 *      What counts is what the server answers, so the switch paints the state
 *      the POST sends back, not the one that was clicked.
 *   2. A button to look for suggestions in the movements that already exist
 *      (the backfill). While it runs the button is disabled and says so; when
 *      it ends it reports what it did, before and after.
 */
export default function CategorizerSettings() {
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(false);
    const [saving, setSaving] = useState(false);

    const [running, setRunning] = useState(false);
    const [report, setReport] = useState(null);

    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        const response = await Api.getCategorizationPreferences();
        setLoading(false);

        if (response?.error) {
            setError("Could not load the auto-categoriser preferences.");
            return;
        }
        setEnabled(Boolean(response.enabled));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleToggle = async (value) => {
        setSaving(true);
        setError(null);

        const response = await Api.updateCategorizationPreferences({ enabled: value });

        setSaving(false);

        if (response?.error) {
            setError(response.error);
            return;
        }
        // The server is the one that knows: paint what it sends back.
        if (typeof response.enabled === "boolean") {
            setEnabled(response.enabled);
        }
    };

    const handleBackfill = async () => {
        setRunning(true);
        setError(null);
        setReport(null);

        const response = await Api.runCategorizationBackfill();

        setRunning(false);

        if (response?.error) {
            setError(response.error);
            return;
        }
        setReport(response);
    };

    const number = (value) => (typeof value === "number" ? value : 0);

    return (
        <div className="mt-5 bg-[#12121f] rounded-2xl border border-gray-800">
            {/* 1. On / off */}
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                        Categorise my movements automatically
                    </div>
                    <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                        When it is on, every movement that comes in is categorised on its own, reading
                        the text the bank sends. It never guesses: a movement it does not know is left
                        without a category for you to fill in.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {saving ? <span className="text-xs text-gray-500">Saving…</span> : null}
                    <Switch
                        aria-label="Categorise my movements automatically"
                        size="lg"
                        color="success"
                        isSelected={enabled}
                        isDisabled={loading || saving}
                        onValueChange={handleToggle}
                    />
                </div>
            </div>

            <div className="border-t border-gray-800/70" />

            {/* 2. Look for suggestions in the movements that already exist */}
            <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-white">
                            Find suggestions in my existing movements
                        </div>
                        <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                            It reads the movements you already have, works out which ones are the same
                            shop and proposes the category they look like. Nothing is changed: they
                            come back as suggestions for you to confirm.
                        </p>
                    </div>

                    <Button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                        onPress={handleBackfill}
                        isLoading={running}
                        isDisabled={running}
                        startContent={
                            !running && <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                        }
                    >
                        {running ? "Looking…" : "Find suggestions"}
                    </Button>
                </div>

                {report && (
                    <div className="mt-3 rounded-xl px-4 py-3 border bg-emerald-500/10 border-emerald-500/30 text-sm text-emerald-300">
                        <div>
                            <span className="font-semibold">{number(report.scanned)}</span> movements
                            reviewed ·{" "}
                            <span className="font-semibold">
                                {number(report.after?.suggestions)}
                            </span>{" "}
                            suggestions ready
                        </div>
                        <div className="text-xs text-emerald-400/80 mt-1">
                            Suggestions went from {number(report.before?.suggestions)} to{" "}
                            {number(report.after?.suggestions)}; {number(report.keys_rewritten)}{" "}
                            movements re-read and {number(report.rules_created)} rules learned.
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="border-t border-gray-800/70 p-4 sm:p-5">
                    <div className="text-sm rounded-xl px-4 py-3 border bg-red-500/10 text-red-400 border-red-500/30">
                        {error}
                    </div>
                </div>
            )}
        </div>
    );
}
