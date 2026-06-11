import React, { useState, useEffect, useCallback } from "react";
import Endpoints from "../../../Api/Endpoints";

import SettingsLayout from "../../layout/SettingsLayout";

export default function ApiKeySettings() {
    const [apiKeys, setApiKeys] = useState([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyValue, setNewKeyValue] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const loadApiKeys = useCallback(async () => {
        try {
            const keys = await Endpoints.getApiKeys();
            if (Array.isArray(keys)) {
                setApiKeys(keys);
            }
        } catch {
            // handled silently
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadApiKeys();
    }, [loadApiKeys]);

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return;
        try {
            setIsLoading(true);
            const result = await Endpoints.createApiKey({ name: newKeyName.trim() });
            if (result?.key) {
                setNewKeyValue(result.key);
                setShowCreateModal(false);
                setShowKeyModal(true);
                setNewKeyName("");
                await loadApiKeys();
            }
        } catch {
            setMessage({ type: "error", text: "Failed to create API key." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteKey = async (id) => {
        try {
            setIsLoading(true);
            await Endpoints.deleteApiKey(id);
            await loadApiKeys();
            setDeleteConfirm(null);
            setMessage({ type: "success", text: "API key deleted." });
        } catch {
            setMessage({ type: "error", text: "Failed to delete API key." });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <SettingsLayout>
            <div className="space-y-8">
                <h2 className="text-2xl font-bold">API Keys</h2>

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
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold">Manage API Keys</h3>
                            <p className="text-gray-400 mt-1 text-sm">
                                Generate API keys to access BudgetBee data from external applications.
                                Use the key in the <code className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">X-API-Key</code> header.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            <span>+</span> Create new API key
                        </button>
                    </div>

                    {isLoading && apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Loading...</div>
                    ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            No API keys created yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {apiKeys.map((apiKey) => (
                                <div
                                    key={apiKey.id}
                                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-white">{apiKey.name}</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Created: {new Date(apiKey.created_at).toLocaleDateString()}
                                            {apiKey.last_used_at && (
                                                <> · Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setDeleteConfirm(apiKey)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Key Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <div className="relative bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Create API Key</h3>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-300 mb-2">Key Name</label>
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                placeholder="e.g. My Integration"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewKeyName("");
                                }}
                                className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateKey}
                                disabled={!newKeyName.trim() || isLoading}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                {isLoading ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Show Generated Key Modal */}
            {showKeyModal && newKeyValue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => {
                            setShowKeyModal(false);
                            setNewKeyValue(null);
                        }}
                    />
                    <div className="relative bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">API Key Created</h3>
                        <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-200 rounded-lg p-3 mb-4 text-sm">
                            ⚠️ Copy your API key now. You won't be able to see it again!
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                readOnly
                                value={newKeyValue}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none"
                            />
                            <button
                                onClick={() => copyToClipboard(newKeyValue)}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                Copy
                            </button>
                        </div>
                        <p className="text-sm text-gray-400">
                            Use this key in the <code className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">X-API-Key</code> header when making requests to <code className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">/api/v1/external/</code> endpoints.
                        </p>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => {
                                    setShowKeyModal(false);
                                    setNewKeyValue(null);
                                }}
                                className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteConfirm(null)}
                    />
                    <div className="relative bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">Delete API Key</h3>
                        <p className="text-gray-300 mb-4">
                            Are you sure you want to delete the key <strong>{deleteConfirm.name}</strong>?
                            This action cannot be undone. Any applications using this key will stop working.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteKey(deleteConfirm.id)}
                                disabled={isLoading}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                {isLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}
