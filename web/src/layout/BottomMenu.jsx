import React from "react";
import { Link } from "react-router-dom";

// Outline (stroke) icons
import { House, Plus, MessageCircleMore } from "lucide-react";

export const OPEN_AI_CHAT_EVENT = "budgetbee:open-ai-chat";

/**
 * Floating bottom navigation (mobile only): a white rounded pill fixed at the
 * bottom with Inicio (dashboard), Añadir (new record) and AI Chat.
 * Hidden on auth pages and data-entry screens via the `hidden` prop.
 */
export default function BottomMenu({ hidden = false }) {
    if (hidden) {
        return null;
    }

    const openChat = () => {
        window.dispatchEvent(new Event(OPEN_AI_CHAT_EVENT));
    };

    const iconProps = {
        className: "text-neutral-600",
        strokeWidth: 2,
        size: 22,
        "aria-hidden": true,
    };

    return (
        <nav
            className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:hidden z-40 flex items-center gap-1 bg-white rounded-full shadow-xl px-2 py-2"
            aria-label="Navegación principal"
        >
            <Link
                to="/dashboard"
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-neutral-100 active:scale-95 transition"
                title="Inicio"
                aria-label="Inicio"
            >
                <House {...iconProps} />
            </Link>

            <Link
                to="/record"
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-neutral-100 active:scale-95 transition"
                title="Añadir"
                aria-label="Añadir"
            >
                <Plus {...iconProps} />
            </Link>

            <button
                onClick={openChat}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-neutral-100 active:scale-95 transition"
                title="Chat IA"
                aria-label="Chat IA"
            >
                <MessageCircleMore {...iconProps} />
            </button>
        </nav>
    );
}
