import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import DashboardCard from "./DashboardCard";
import RecordModalButton from "../../../Components/Record/RecordModalButton";
import ImportModal from "../../../Components/Import/ImportModal";

/**
 * The three everyday actions, gathered in one place: add a movement, import a
 * statement, and review what the auto-categoriser is suggesting. The first two
 * are the app's own buttons, so the forms behind them are the ones already in
 * use.
 */
export default function QuickActionsCard({ onRecordChange }) {
    return (
        <DashboardCard title="Quick actions" icon="fa-solid fa-bolt" tone="blue">
            <div className="mt-4 flex flex-col gap-2">
                <RecordModalButton onRecordChange={onRecordChange} />
                <ImportModal />
                <Link
                    to="/settings/category-rules"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-gray-800 bg-[#0a0a0f] px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                    <FontAwesomeIcon icon="fa-solid fa-wand-magic-sparkles" />
                    Review suggestions
                </Link>
            </div>
        </DashboardCard>
    );
}
