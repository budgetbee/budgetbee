import React, { useEffect, useState } from "react";
import { Button } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";

/**
 * The large in-settings notice for the auto-categoriser.
 *
 * It is shown once for every user: if the backend says this user has not seen
 * it yet (card_seen is false) the card is painted; pressing "Got it" tells the
 * backend and it never comes back. It carries the same message as the welcome
 * modal, for whoever reached settings without reading it.
 */
export default function CategorizerNoticeCard() {
    const [visible, setVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            const response = await Api.getCategorizationPreferences();

            // No answer: do not show a notice that could not be dismissed.
            if (cancelled || response?.error) {
                return;
            }
            if (response.card_seen === false) {
                setVisible(true);
            }
        };

        check();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleGotIt = async () => {
        setSaving(true);
        await Api.markCategorizationCardSeen();
        setSaving(false);
        setVisible(false);
    };

    if (!visible) {
        return null;
    }

    return (
        <div className="mt-5 bg-[#12121f] rounded-2xl p-5 border border-emerald-500/25">
            <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-lg shrink-0">
                    <FontAwesomeIcon icon="fa-solid fa-wand-magic-sparkles" />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">
                        New: your movements can categorise themselves
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        The auto-categoriser reads the text your bank sends and applies what it has
                        learned from your own movements. It works on every import, with no AI and
                        without using the amount to guess.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        It is <span className="text-white">off by default</span>. Turn it on with the
                        switch below whenever you like.
                    </p>
                </div>

                <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                    onPress={handleGotIt}
                    isLoading={saving}
                    startContent={!saving && <FontAwesomeIcon icon="fa-solid fa-check" />}
                >
                    Got it
                </Button>
            </div>
        </div>
    );
}
