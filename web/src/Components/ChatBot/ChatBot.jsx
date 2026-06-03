import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCommentDots,
    faPaperPlane,
    faTimes,
    faRobot,
    faPaperclip,
    faFile,
    faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import Endpoints from "../../Api/Endpoints";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hi! I'm your BudgetBee assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE);
        const tooBig = selected.filter((f) => f.size > MAX_FILE_SIZE);

        if (tooBig.length > 0) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Some files exceed the 10 MB limit and were skipped: ${tooBig.map((f) => f.name).join(", ")}`,
                },
            ]);
        }

        setFiles((prev) => [...prev, ...valid]);
        // Reset so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        const text = input.trim();
        if ((!text && files.length === 0) || loading) return;

        const currentFiles = [...files];

        // Build user message for the chat bubble
        let content = text;
        const userMessage = {
            role: "user",
            content: content || "",
            files: currentFiles.map((f) => ({
                name: f.name,
                size: f.size,
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
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const canSend = (input.trim() || files.length > 0) && !loading;

    return (
        <>
            {/* Floating toggle button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                    title="Open AI Chat"
                >
                    <FontAwesomeIcon icon={faCommentDots} className="text-xl" />
                </button>
            )}

            {/* Chat panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-96 h-[550px] bg-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-600 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-700 border-b border-gray-600">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faRobot} className="text-blue-400" />
                            <span className="font-semibold text-white">BudgetBee AI</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-br-sm"
                                            : "bg-gray-700 text-gray-100 rounded-bl-sm"
                                    }`}
                                >
                                    {msg.content && <p>{msg.content}</p>}
                                    {msg.files && msg.files.length > 0 && (
                                        <div className="mt-1 space-y-1">
                                            {msg.files.map((f, fi) => (
                                                <div
                                                    key={fi}
                                                    className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${
                                                        msg.role === "user"
                                                            ? "bg-blue-500/50"
                                                            : "bg-gray-600"
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={faFile} className="text-xs" />
                                                    <span className="truncate max-w-[150px]">{f.name}</span>
                                                    <span className="opacity-60 flex-shrink-0">
                                                        {formatFileSize(f.size)}
                                                    </span>
                                                </div>
                                            ))}
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
                        <div className="px-4 py-2 bg-gray-750 border-t border-gray-600 flex flex-wrap gap-2">
                            {files.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-1.5 bg-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                                >
                                    <FontAwesomeIcon icon={faFile} className="text-blue-400" />
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                    <span className="text-gray-400">{formatFileSize(file.size)}</span>
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
                    <div className="px-4 py-3 bg-gray-700 border-t border-gray-600">
                        <div className="flex gap-2">
                            <button
                                onClick={handleAttachClick}
                                disabled={loading}
                                className="px-2 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-gray-300 hover:text-white rounded-lg transition-colors"
                                title="Attach file"
                            >
                                <FontAwesomeIcon icon={faPaperclip} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                                className="hidden"
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                disabled={loading}
                                className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!canSend}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
