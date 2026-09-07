import React, { useState, useEffect, useCallback } from "react";
import Endpoints from "../../../Api/Endpoints";

import SettingsLayout from "../../layout/SettingsLayout";

export default function BaseSettings() {
    const [aiKeys, setAiKeys] = useState({});
    const [openaiKey, setOpenaiKey] = useState("");
    const [deepseekKey, setDeepseekKey] = useState("");
    const [customKey, setCustomKey] = useState("");
    const [customBaseUrl, setCustomBaseUrl] = useState("");
    const [customModel, setCustomModel] = useState("");
    const [customVision, setCustomVision] = useState(false);
    const [savingProvider, setSavingProvider] = useState(null);
    const [message, setMessage] = useState(null);

    const loadAiKeys = useCallback(async () => {
        const response = await Endpoints.getAiProviderKeys();
        if (!response?.error && Array.isArray(response)) {
            const keysMap = {};
            response.forEach((item) => {
                keysMap[item.provider] = item;
            });
            setAiKeys(keysMap);
            // Pre-fill the custom provider's stored config so editing shows
            // the current values instead of empty fields.
            if (keysMap.custom) {
                setCustomBaseUrl(keysMap.custom.base_url || "");
                setCustomModel(keysMap.custom.model || "");
                setCustomVision(!!keysMap.custom.supports_vision);
            }
        }
    }, []);

    useEffect(() => {
        loadAiKeys();
    }, [loadAiKeys]);

    const handleSave = async (provider) => {
        setSavingProvider(provider);
        setMessage(null);

        const payload = { provider };

        if (provider === "openai") {
            payload.api_key = openaiKey;
        } else if (provider === "deepseek") {
            payload.api_key = deepseekKey;
        } else if (provider === "custom") {
            payload.api_key = customKey;
            payload.base_url = customBaseUrl;
            payload.model = customModel;
            payload.supports_vision = customVision;
        }

        const response = await Endpoints.saveAiProviderKey(payload);

        if (response?.error) {
            setMessage({ type: "error", text: response.error });
        } else {
            const providerName =
                provider === "custom"
                    ? "Custom (OpenAI-compatible)"
                    : provider.charAt(0).toUpperCase() + provider.slice(1);
            setMessage({ type: "success", text: `${providerName} API key saved successfully.` });
            await loadAiKeys();
            if (provider === "openai") setOpenaiKey("");
            if (provider === "deepseek") setDeepseekKey("");
            if (provider === "custom") setCustomKey("");
        }

        setSavingProvider(null);
    };

    const handleDelete = async (id, provider) => {
        setMessage(null);
        const response = await Endpoints.deleteAiProviderKey(id);

        if (response?.error) {
            setMessage({ type: "error", text: response.error });
        } else {
            const providerName =
                provider === "custom"
                    ? "Custom (OpenAI-compatible)"
                    : provider.charAt(0).toUpperCase() + provider.slice(1);
            setMessage({ type: "success", text: `${providerName} API key deleted.` });
            await loadAiKeys();
            if (provider === "custom") {
                setCustomBaseUrl("");
                setCustomModel("");
                setCustomVision(false);
            }
        }
    };

    const inputClass =
        "flex-1 bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500";

    return (
        <SettingsLayout>
            <div className="space-y-8">
                <h2 className="text-2xl font-bold">Main Settings</h2>

                {message && (
                    <div
                        className={`p-4 rounded-lg ${
                            message.type === "error"
                                ? "bg-red-800 text-red-100"
                                : "bg-green-800 text-green-100"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4">AI Provider API Keys</h3>
                    <p className="text-gray-400 mb-6 text-sm">
                        Configure your API keys for AI providers. Keys are encrypted before being stored in the database.
                        Prefer a self-hosted model? Use the <span className="text-gray-200">Custom (OpenAI-compatible)</span>{" "}
                        section to connect Ollama, Open WebUI, vLLM or any other OpenAI-compatible endpoint — your
                        financial data never leaves your server.
                    </p>

                    {/* OpenAI */}
                    <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-200">
                                OpenAI API Key
                            </label>
                            {aiKeys.openai && (
                                <span className="text-xs text-gray-400 font-mono bg-gray-600 px-2 py-1 rounded">
                                    {aiKeys.openai.masked_key}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="password"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                placeholder={aiKeys.openai ? "Enter new key to replace existing" : "sk-..."}
                                className={inputClass}
                            />
                            <button
                                onClick={() => handleSave("openai")}
                                disabled={!openaiKey.trim() || savingProvider === "openai"}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                {savingProvider === "openai" ? "Saving..." : "Save"}
                            </button>
                            {aiKeys.openai && (
                                <button
                                    onClick={() => handleDelete(aiKeys.openai.id, "openai")}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* DeepSeek */}
                    <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-200">
                                DeepSeek API Key
                            </label>
                            {aiKeys.deepseek && (
                                <span className="text-xs text-gray-400 font-mono bg-gray-600 px-2 py-1 rounded">
                                    {aiKeys.deepseek.masked_key}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="password"
                                value={deepseekKey}
                                onChange={(e) => setDeepseekKey(e.target.value)}
                                placeholder={aiKeys.deepseek ? "Enter new key to replace existing" : "sk-..."}
                                className={inputClass}
                            />
                            <button
                                onClick={() => handleSave("deepseek")}
                                disabled={!deepseekKey.trim() || savingProvider === "deepseek"}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                {savingProvider === "deepseek" ? "Saving..." : "Save"}
                            </button>
                            {aiKeys.deepseek && (
                                <button
                                    onClick={() => handleDelete(aiKeys.deepseek.id, "deepseek")}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Custom OpenAI-compatible (Ollama, Open WebUI, vLLM, ...) */}
                    <div className="p-4 bg-gray-700/50 rounded-lg border border-dashed border-gray-500">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-medium text-gray-200">
                                Custom (OpenAI-compatible) — Ollama, Open WebUI, vLLM...
                            </label>
                            {aiKeys.custom && (
                                <span className="text-xs text-gray-400 font-mono bg-gray-600 px-2 py-1 rounded">
                                    {aiKeys.custom.masked_key}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            Keep your financial data on your own infrastructure. Point BudgetBee at any
                            OpenAI-compatible endpoint (e.g. Ollama, Open WebUI, vLLM, LocalAI).
                        </p>

                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <label className="text-sm text-gray-300 w-32 shrink-0 leading-9">
                                    Base URL
                                </label>
                                <input
                                    type="text"
                                    value={customBaseUrl}
                                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                                    placeholder="http://localhost:11434/v1 (Ollama) or https://host/api (Open WebUI)"
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex gap-3">
                                <label className="text-sm text-gray-300 w-32 shrink-0 leading-9">
                                    Model
                                </label>
                                <input
                                    type="text"
                                    value={customModel}
                                    onChange={(e) => setCustomModel(e.target.value)}
                                    placeholder="e.g. gpt-oss:20b, llama3.1, qwen2.5"
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex gap-3">
                                <label className="text-sm text-gray-300 w-32 shrink-0 leading-9">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={customKey}
                                    onChange={(e) => setCustomKey(e.target.value)}
                                    placeholder={
                                        aiKeys.custom
                                            ? "Enter new key to replace existing (optional for Ollama)"
                                            : "Optional for Ollama, required for Open WebUI"
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customVision}
                                    onChange={(e) => setCustomVision(e.target.checked)}
                                    className="w-4 h-4 rounded bg-gray-600 border-gray-500"
                                />
                                This model supports vision (image analysis of bank statements)
                            </label>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => handleSave("custom")}
                                disabled={
                                    savingProvider === "custom" ||
                                    !customBaseUrl.trim() ||
                                    !customModel.trim() ||
                                    (!customKey.trim() && !aiKeys.custom)
                                }
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                {savingProvider === "custom" ? "Saving..." : "Save"}
                            </button>
                            {aiKeys.custom && (
                                <button
                                    onClick={() => handleDelete(aiKeys.custom.id, "custom")}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}
