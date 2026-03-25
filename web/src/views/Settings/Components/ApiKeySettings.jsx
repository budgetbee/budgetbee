import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
    Snippet,
} from "@nextui-org/react";
import Api from "../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ApiKeySettings() {
    const [apiKeys, setApiKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyValue, setNewKeyValue] = useState(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const {
        isOpen: isKeyOpen,
        onOpen: onKeyOpen,
        onOpenChange: onKeyOpenChange,
    } = useDisclosure();

    async function loadApiKeys() {
        try {
            const keys = await Api.getApiKeys();
            if (Array.isArray(keys)) {
                setApiKeys(keys);
            }
        } catch (error) {
            // handle error
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadApiKeys();
    }, []);

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return;
        try {
            setIsLoading(true);
            const result = await Api.createApiKey({ name: newKeyName });
            if (result && result.key) {
                setNewKeyValue(result.key);
                onOpenChange();
                onKeyOpen();
                setNewKeyName("");
                loadApiKeys();
            }
        } catch (error) {
            // handle error
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteKey = async (id) => {
        try {
            setIsLoading(true);
            await Api.deleteApiKey(id);
            loadApiKeys();
        } catch (error) {
            // handle error
        } finally {
            setIsLoading(false);
        }
    };

    const CreateKeyModal = (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            className="mt-10"
            placement="center"
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Create API Key
                        </ModalHeader>
                        <ModalBody>
                            <Input
                                label="Key Name"
                                placeholder="e.g. My Integration"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                variant="bordered"
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="flat"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onClick={handleCreateKey}
                                isLoading={isLoading}
                            >
                                Create
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );

    const ShowKeyModal = (
        <Modal
            isOpen={isKeyOpen}
            onOpenChange={onKeyOpenChange}
            className="mt-10"
            placement="center"
            backdrop="blur"
            size="lg"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            API Key Created
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-sm text-warning">
                                <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" className="mr-2" />
                                Copy your API key now. You won't be able to see it again!
                            </p>
                            <Snippet
                                symbol=""
                                variant="bordered"
                                className="mt-2"
                            >
                                {newKeyValue}
                            </Snippet>
                            <p className="text-sm text-default-500 mt-2">
                                Use this key in the <code>X-API-Key</code> header when making requests to <code>/api/v1/external/</code> endpoints.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="primary"
                                onClick={() => {
                                    setNewKeyValue(null);
                                    onClose();
                                }}
                            >
                                Done
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );

    return (
        <div className="mt-20 px-5 m-auto relative text-white">
            {CreateKeyModal}
            {ShowKeyModal}
            <h3 className="text-3xl font-bold mb-4">API Keys</h3>
            <p className="text-sm text-default-500 mb-4">
                Generate API keys to access BudgetBee data from external applications.
                Use the key in the <code>X-API-Key</code> header.
            </p>
            <div className="mb-4">
                <Button
                    color="primary"
                    onPress={onOpen}
                    startContent={
                        <FontAwesomeIcon icon="fa-solid fa-plus" />
                    }
                >
                    Create new API key
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {apiKeys.map((apiKey) => (
                    <div
                        key={apiKey.id}
                        className="flex flex-row justify-between items-center p-4 rounded-lg border border-default-200"
                    >
                        <div className="flex flex-col">
                            <span className="font-semibold">{apiKey.name}</span>
                            <span className="text-sm text-default-500">
                                Created: {new Date(apiKey.created_at).toLocaleDateString()}
                                {apiKey.last_used_at && (
                                    <> · Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</>
                                )}
                            </span>
                        </div>
                        <Button
                            color="danger"
                            variant="flat"
                            size="sm"
                            onClick={() => handleDeleteKey(apiKey.id)}
                            startContent={
                                <FontAwesomeIcon icon="fa-solid fa-trash" />
                            }
                        >
                            Delete
                        </Button>
                    </div>
                ))}
                {apiKeys.length === 0 && !isLoading && (
                    <p className="text-default-500">No API keys created yet.</p>
                )}
            </div>
        </div>
    );
}
