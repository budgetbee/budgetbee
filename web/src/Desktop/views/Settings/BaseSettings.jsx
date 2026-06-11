import React, { useState, useEffect, useCallback } from "react";
import Endpoints from "../../../Api/Endpoints";

import SettingsLayout from "../../layout/SettingsLayout";

export default function BaseSettings() {
    const [aiKeys, setAiKeys] = useState({});
    const [openaiKey, setOpenaiKey] = useState("");
    const [deepseekKey, setDeepseekKey] = useState("");
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
        }
    }, []);

    useEffect(() => {
        loadAiKeys();
    }, [loadAiKeys]);

    const handleSave = async (provider, apiKey) => {
        setSavingProvider(provider);
        setMessage(null);

        const response = await Endpoints.saveAiProviderKey({
            provider,
            api_key: apiKey,
        });

        if (response?.error) {
            setMessage({ type: "error", text: response.error });
        } else {
            setMessage({ type: "success", text: `${provider} API key saved successfully.` });
            await loadAiKeys();
            if (provider === "openai") setOpenaiKey("");
            if (provider === "deepseek") setDeepseekKey("");
        }

        setSavingProvider(null);
    };

    const handleDelete = async (id, provider) => {
        setMessage(null);
        const response = await Endpoints.deleteAiProviderKey(id);

        if (response?.error) {
            setMessage({ type: "error", text: response.error });
        } else {
            setMessage({ type: "success", text: `${provider} API key deleted.` });
            await loadAiKeys();
        }
    };

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
                                className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={() => handleSave("openai", openaiKey)}
                                disabled={!openaiKey.trim() || savingProvider === "openai"}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                {savingProvider === "openai" ? "Saving..." : "Save"}
                            </button>
                            {aiKeys.openai && (
                                <button
                                    onClick={() => handleDelete(aiKeys.openai.id, "OpenAI")}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* DeepSeek */}
                    <div className="p-4 bg-gray-700/50 rounded-lg">
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
                                className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={() => handleSave("deepseek", deepseekKey)}
                                disabled={!deepseekKey.trim() || savingProvider === "deepseek"}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                {savingProvider === "deepseek" ? "Saving..." : "Save"}
                            </button>
                            {aiKeys.deepseek && (
                                <button
                                    onClick={() => handleDelete(aiKeys.deepseek.id, "DeepSeek")}
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
