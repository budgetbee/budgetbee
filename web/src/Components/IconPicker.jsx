import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

/**
 * Icons the app already uses for its default categories — shown first
 * when the picker opens (before any search).
 */
const POPULAR = [
    "arrow-trend-up", "bars", "basket-shopping", "beer-mug-empty", "book-open",
    "briefcase", "building-columns", "cake-candles", "calendar-days", "car",
    "champagne-glasses", "chart-line", "coins", "desktop", "dog", "dumbbell",
    "gamepad", "gas-pump", "gift", "handcuffs", "house", "house-chimney-window",
    "key", "landmark", "laptop", "lightbulb", "money-bill", "money-bill-1-wave",
    "money-bill-transfer", "person", "phone", "plane-departure", "question",
    "scale-balanced", "screwdriver-wrench", "sheet-plastic", "shirt", "shop",
    "spray-can-sparkles", "square-parking", "toolbox", "tv", "utensils", "wifi",
];

/**
 * Extra useful icons that complement the default set.
 */
const COMMON = [
    "baby", "bed", "bicycle", "bolt", "book", "broom", "burger", "bus",
    "camera", "cart-shopping", "cat", "circle-check", "circle-info", "clock",
    "cloud", "code", "comment", "credit-card", "cross", "diamond", "dice",
    "disease", "dragon", "droplet", "envelope", "eye", "face-smile", "fan",
    "feather", "file", "film", "filter", "fire", "flag", "flask", "folder",
    "football", "futbol", "gauge-high", "gem", "glasses", "globe", "graduation-cap",
    "hammer", "hand-holding-dollar", "handshake", "headphones", "heart", "heart-pulse",
    "hospital", "ice-cream", "image", "inbox", "info", "keyboard", "kitchen-set",
    "lock", "map", "map-pin", "medal", "message", "microphone", "mobile-screen-button",
    "money-check-dollar", "motorcycle", "mountain", "mug-hot", "music", "newspaper",
    "note-sticky", "palette", "paper-plane", "paw", "pencil", "piggy-bank", "pizza-slice",
    "plane", "plug", "puzzle-piece", "receipt", "rocket", "route", "ruler", "scissors",
    "seedling", "shield-halved", "ship", "shop", "snowflake", "star", "stethoscope",
    "suitcase", "sun", "tablets", "tags", "taxi", "ticket", "tooth", "tractor",
    "train", "trophy", "truck", "truck-fast", "umbrella", "user", "users", "van-shuttle",
    "video", "wine-glass", "wrench", "xmark", "zap",
];

// Full catalogue: FA free-solid icon keys -> "fa-solid fa-<kebab-name>".
// All solid icons are registered in the FA library by App.jsx, so the
// returned strings resolve fine when rendered with FontAwesomeIcon.
const CATALOGUE = Object.keys(fas)
    .map((key) => {
        if (!key.startsWith("fa") || key.length <= 2) return null;
        const camel = key.slice(2);
        const kebab = camel
            .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
            .toLowerCase();
        if (!kebab || kebab.length < 2) return null;
        return kebab;
    })
    .filter(Boolean)
    .sort();
const INITIAL = [...new Set([...POPULAR, ...COMMON])].slice(0, 240);

const kebabToClass = (name) => `fa-solid fa-${name}`;

export default function IconPicker({ value, onChange, className = "" }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return INITIAL;
        return CATALOGUE.filter((name) => name.includes(q)).slice(0, 500);
    }, [query]);

    const handlePick = (name) => {
        onChange(kebabToClass(name));
        setOpen(false);
        setQuery("");
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 hover:ring-2 hover:ring-blue-500 hover:scale-110 transition-all duration-150 cursor-pointer ${className}`}
                title="Change icon"
            >
                <FontAwesomeIcon
                    icon={value || "fa-solid fa-icons"}
                    className="text-white text-xl"
                />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
                    <div className="w-full sm:w-[560px] bg-[#1a1a2b] border border-gray-700 rounded-t-2xl sm:rounded-2xl p-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-semibold text-lg">
                                Choose an icon
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-white px-2 py-1"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-[#12121f] border border-gray-700 rounded-xl px-3 mb-3">
                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                className="text-gray-500"
                            />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search icons..."
                                className="w-full bg-transparent py-3 text-white placeholder-gray-500 focus:outline-none"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="text-gray-500 hover:text-white text-xs px-1"
                                >
                                    clear
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 overflow-y-auto min-h-0">
                            {results.map((name) => {
                                const cls = kebabToClass(name);
                                const active = value === cls;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => handlePick(name)}
                                        className={`aspect-square flex items-center justify-center rounded-lg text-gray-300 hover:bg-blue-600 hover:text-white hover:scale-110 transition-all duration-100 cursor-pointer ${
                                            active
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-800"
                                        }`}
                                        title={name}
                                    >
                                        <FontAwesomeIcon
                                            icon={cls}
                                            className="text-lg"
                                        />
                                    </button>
                                );
                            })}
                            {results.length === 0 && (
                                <div className="col-span-full text-center text-gray-500 py-8 text-sm">
                                    No icons found for "{query}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
