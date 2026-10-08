import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Modal,
    ModalContent,
    ModalBody,
    ModalFooter,
    Button,
} from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../Api/Endpoints";

/**
 * The welcome notice for the new auto-categoriser.
 *
 * It is shown once for every user and never again: the app asks the backend
 * whether this user has already seen it (intro_seen) and, only if not, opens
 * this modal. Whatever way it closes — its button, "Not now" or the backdrop —
 * the backend is told it has been seen, so it can never come back, not even
 * after logging out or signing in from another device.
 *
 * It is mounted in both the desktop and the mobile layout, so it behaves the
 * same on every screen.
 */
export default function CategorizerIntroModal() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    // The backend must be told only once: the button, "Not now" and the
    // backdrop can all close the modal, and any of them counts.
    const reported = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            const response = await Api.getCategorizationPreferences();

            // No answer (offline, error): stay quiet. Showing a welcome the
            // user cannot dismiss properly would be worse than not showing it.
            if (cancelled || response?.error) {
                return;
            }
            if (response.intro_seen === false) {
                setIsOpen(true);
            }
        };

        check();
        return () => {
            cancelled = true;
        };
    }, []);

    const markSeen = async () => {
        if (reported.current) {
            return;
        }
        reported.current = true;
        await Api.markCategorizationIntroSeen();
    };

    // Covers the backdrop and the Escape key; the buttons below are explicit.
    const handleOpenChange = (open) => {
        setIsOpen(open);
        if (!open) {
            markSeen();
        }
    };

    const handleNotNow = () => {
        markSeen();
        setIsOpen(false);
    };

    const handleGoToSettings = () => {
        markSeen();
        setIsOpen(false);
        navigate("/settings/category-rules");
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={handleOpenChange}
            size="lg"
            placement="center"
            backdrop="blur"
            classNames={{
                base: "bg-[#0a0a0f] border border-gray-800",
                closeButton: "text-gray-400 hover:bg-[#1a1a2e]",
            }}
        >
            <ModalContent>
                <ModalBody className="pt-10 pb-2">
                    <div className="flex items-start gap-4">
                        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xl shrink-0">
                            <FontAwesomeIcon icon="fa-solid fa-wand-magic-sparkles" />
                        </span>

                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-white">
                                A new auto-categoriser is here
                            </h2>
                            <p className="text-sm text-gray-400 mt-2">
                                BudgetBee can now categorise the movements you import by itself, reading
                                the text your bank sends and using what it has learned from your own
                                history. No AI is involved and the amount is never used to guess.
                            </p>
                        </div>
                    </div>

                    <div className="mt-2 rounded-2xl border border-gray-800 bg-[#12121f] px-4 py-3">
                        <p className="text-sm text-gray-300">
                            It comes <span className="text-white font-medium">turned off</span> by
                            default, so nothing changes until you say so.
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            You can switch it on any time in{" "}
                            <span className="text-white font-medium">
                                Settings → Auto-categorisation
                            </span>
                            .
                        </p>
                    </div>
                </ModalBody>

                <ModalFooter className="border-t border-gray-800/60">
                    <Button
                        variant="light"
                        className="text-gray-300"
                        onPress={handleNotNow}
                    >
                        Not now
                    </Button>
                    <Button
                        className="bg-green-500 text-white hover:bg-green-600"
                        onPress={handleGoToSettings}
                        startContent={<FontAwesomeIcon icon="fa-solid fa-sliders" />}
                    >
                        Go to settings
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
