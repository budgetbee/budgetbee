import React, { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCommentDots,
    faPaperPlane,
    faTimes,
    faRobot,
    faPaperclip,
    faFile,
    faFileImage,
    faCircleXmark,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Endpoints from "../../Api/Endpoints";
import MarkdownRenderer from "./MarkdownRenderer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Module-level state persists across SPA route changes but resets on full page refresh
let persistedOpen = false;
let persistedMessages = [
    {
        role: "assistant",
        content: "Hi! I'm your BudgetBee assistant. How can I help you today?",
    },
];
let persistedProvider = "";

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImageFile(file) {
    return file.type.startsWith("image/");
}

function getFileIcon(file) {
    return isImageFile(file) ? faFileImage : faFile;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(persistedOpen);
    const [messages, setMessages] = useState(persistedMessages);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState(persistedProvider);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const chatPanelRef = useRef(null);

    // Sync state to module-level so it survives SPA route changes
    useEffect(() => { persistedOpen = isOpen; }, [isOpen]);
    useEffect(() => { persistedMessages = messages; }, [messages]);
    useEffect(() => { persistedProvider = provider; }, [provider]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // Cleanup object URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            files.forEach((f) => {
                if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
            });
        };
    }, [files]);

    const addFiles = useCallback((newFiles) => {
        const valid = newFiles.filter((f) => f.file.size <= MAX_FILE_SIZE);
        const tooBig = newFiles.filter((f) => f.file.size > MAX_FILE_SIZE);

        if (tooBig.length > 0) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Some files exceed the 10 MB limit and were skipped: ${tooBig.map((f) => f.displayName).join(", ")}`,
                },
            ]);
        }

        // Generate preview URLs for images, keep real File intact
        const wrapped = valid.map((f) => ({
            file: f.file,
            displayName: f.displayName,
            previewUrl: isImageFile(f.file) ? URL.createObjectURL(f.file) : null,
        }));

        setFiles((prev) => [...prev, ...wrapped]);
    }, []);

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files).map((f) => ({
            file: f,
            displayName: f.name,
        }));
        addFiles(selected);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePaste = useCallback(
        (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const imageItems = [];
            for (const item of items) {
                if (item.type.startsWith("image/")) {
                    imageItems.push(item);
                }
            }

            if (imageItems.length === 0) return;

            e.preventDefault();

            const pastedFiles = [];
            imageItems.forEach((item, idx) => {
                const blob = item.getAsFile();
                if (blob && blob.size > 0) {
                    const ext = item.type.split("/")[1] || "png";
                    const timestamp = Date.now();
                    pastedFiles.push({
                        file: blob,
                        displayName: `screenshot_${timestamp}_${idx + 1}.${ext}`,
                    });
                }
            });

            if (pastedFiles.length > 0) {
                addFiles(pastedFiles);
            }
        },
        [addFiles]
    );

    const removeFile = (index) => {
        setFiles((prev) => {
            const entry = prev[index];
            if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSend = async () => {
        const text = input.trim();
        if ((!text && files.length === 0) || loading) return;

        // Build file list with display names for FormData
        const currentFiles = files.map((f) => ({
            file: f.file,
            name: f.displayName,
        }));

        const userMessage = {
            role: "user",
            content: text || "",
            files: files.map((f) => ({
                name: f.displayName,
                size: f.file.size,
                type: f.file.type,
                previewUrl: f.previewUrl,
            })),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setFiles([]);
        setLoading(true);

        const response = await Endpoints.chatMessage(text, currentFiles);

        if (response?.error) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, something went wrong. Please try again." },
            ]);
        } else {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.message },
            ]);
            if (response.provider) {
                setProvider(response.provider);
            }
        }

        setLoading(false);
        // Restore focus to input after response arrives
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        // Don't intercept paste (Ctrl+V) — let the onPaste handler deal with it
        if ((e.ctrlKey || e.metaKey) && e.key === "v") return;

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = async () => {
        await Endpoints.clearChatHistory();
        setMessages([]);
        setInput("");
        setFiles([]);
        setProvider("");
        persistedMessages = [];
        persistedProvider = "";
    };

    const handleClose = () => setIsOpen(false);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && isOpen) setIsOpen(false);
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen]);

    const canSend = (input.trim() || files.length > 0) && !loading;

    return (
        <>
            {/* Floating toggle button — just above the FloatMenu (+) on mobile */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-32 right-[3.2em] sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                    title="Open AI Chat"
                >
                    <FontAwesomeIcon icon={faCommentDots} className="text-xl" />
                </button>
            )}

            {/* Modal overlay + centered chat panel — responsive on mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
                    onClick={handleOverlayClick}
                >
                    <div
                        ref={chatPanelRef}
                        className="w-full sm:w-[700px] h-[85vh] sm:h-[600px] max-h-[90vh] bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col border border-gray-600 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border-b border-gray-600 rounded-t-xl">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <FontAwesomeIcon icon={faRobot} className="text-blue-400 text-sm sm:text-base" />
                                <span className="font-semibold text-white text-base sm:text-lg">BudgetBee AI</span>
                                {provider && (
                                    <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-600 px-1.5 py-0.5 rounded hidden sm:inline">
                                        {provider}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleNewChat}
                                    className="text-gray-400 hover:text-white transition-colors px-1.5 sm:px-2"
                                    title="New conversation"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="text-sm sm:text-base" />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="text-gray-400 hover:text-white transition-colors px-1.5 sm:px-2"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm sm:text-base" />
                                </button>
                            </div>
                        </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm ${
                                        msg.role === "user"
                                            ? "max-w-[85%] sm:max-w-[80%] bg-blue-600 text-white rounded-br-sm"
                                            : "max-w-[95%] sm:max-w-[90%] bg-gray-700 text-gray-100 rounded-bl-sm"
                                    }`}
                                >
                                    {msg.content && msg.role === "assistant" ? (
                                        <MarkdownRenderer content={msg.content} />
                                    ) : msg.content ? (
                                        <p>{msg.content}</p>
                                    ) : null}
                                    {msg.files && msg.files.length > 0 && (
                                        <div className="mt-1 space-y-1">
                                            {msg.files.map((f, fi) =>
                                                f.previewUrl ? (
                                                    <img
                                                        key={fi}
                                                        src={f.previewUrl}
                                                        alt={f.name}
                                                        className="max-w-full max-h-48 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div
                                                        key={fi}
                                                        className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${
                                                            msg.role === "user"
                                                                ? "bg-blue-500/50"
                                                                : "bg-gray-600"
                                                        }`}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={getFileIcon(f)}
                                                            className="text-xs"
                                                        />
                                                        <span className="truncate max-w-[150px]">{f.name}</span>
                                                        <span className="opacity-60 flex-shrink-0">
                                                            {formatFileSize(f.size)}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-xl rounded-bl-sm text-sm">
                                    <span className="inline-flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* File previews */}
                    {files.length > 0 && (
                        <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-750 border-t border-gray-600 flex flex-wrap gap-1.5 sm:gap-2">
                            {files.map((entry, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-1.5 bg-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                                >
                                    {entry.previewUrl ? (
                                        <img
                                            src={entry.previewUrl}
                                            alt={entry.displayName}
                                            className="w-6 h-6 rounded object-cover"
                                        />
                                    ) : (
                                        <FontAwesomeIcon icon={getFileIcon(entry.file)} className="text-blue-400" />
                                    )}
                                    <span className="truncate max-w-[120px]">{entry.displayName}</span>
                                    <span className="text-gray-400">{formatFileSize(entry.file.size)}</span>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="text-gray-400 hover:text-red-400 ml-1"
                                    >
                                        <FontAwesomeIcon icon={faCircleXmark} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-700 border-t border-gray-600">
                        <div className="hidden sm:flex gap-2 items-center text-xs text-gray-400 mb-1.5">
                            <span>Ctrl+V to paste images</span>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            <button
                                onClick={handleAttachClick}
                                className="px-1.5 sm:px-2 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors flex-shrink-0"
                                title="Attach file"
                            >
                                <FontAwesomeIcon icon={faPaperclip} className="text-xs sm:text-sm" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                                accept="image/*,.pdf,.csv,.xlsx,.xls,.ods,.txt"
                                className="hidden"
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 min-w-0 bg-gray-600 border border-gray-500 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!canSend}
                                className="px-2 sm:px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} className="text-xs sm:text-sm" />
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            )}
        </>
    );
}

