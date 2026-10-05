import React, { useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
} from "@nextui-org/react";
import Dropzone from "./Dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";

export default function ImportModal() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [loading, setLoading] = useState(false);
    const [isDropped, setIsDropped] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [uploadOk, setUploadOk] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [autoCategorise, setAutoCategorise] = useState(false);
    const [summary, setSummary] = useState(null);

    const handleUploadFile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        const formData = new FormData(e.target);
        formData.append("file", selectedFile, selectedFile.name);
        // Only rows that arrive without a category are categorised; anything the
        // user's own system already categorised is left exactly as it is.
        formData.append("auto_categorise", autoCategorise ? "1" : "0");
        // Send the real FormData so axios uses multipart/form-data — a plain
        // object would be JSON-serialized and the file would never arrive.
        const response = await Api.importRecords(formData);

        if (response.error) {
            setErrorMsg(response.error);
        } else {
            setSummary(response);
            setUploadOk(true);
        }

        setLoading(false);
    };

    const handleCloseModal = () => {
        setUploadOk(false);
        setSelectedFile(null);
        setIsDropped(false);
        onOpenChange();
    };

    return (
        <>
            <Button
                onPress={onOpen} 
                color="primary" 
                className="w-full"
                startContent={
                    <FontAwesomeIcon icon="fa-solid fa-cloud-arrow-up" />
                }
            >
                Import
            </Button>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="top-center"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <form onSubmit={handleUploadFile}>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex flex-row gap-x-2">
                                        <a
                                            href="/import/excelTemplate.xlsx"
                                            download="excel_template.xlsx"
                                        >
                                            <Button
                                                color="default"
                                                className="text-white"
                                                type="button"
                                            >
                                                Excel template
                                            </Button>
                                        </a>
                                        <a
                                            href="/import/jsonTemplate.json"
                                            download="json_template.json"
                                        >
                                            <Button
                                                color="default"
                                                className="text-white"
                                                type="button"
                                            >
                                                Json template
                                            </Button>
                                        </a>
                                    </div>
                                </ModalHeader>
                                <ModalBody>
                                    <p className="text-xs text-gray-400">
                                        A movement without a category is accepted: it is kept as Unknown.
                                        Use Upload and categorise and the app will look for the best category
                                        for those movements with your own rules and what it has already
                                        learned. Movements that already bring a category are respected and
                                        are never changed.
                                    </p>
                                    <Dropzone
                                        setSelectedFile={setSelectedFile}
                                        setIsDropped={setIsDropped}
                                    />
                                </ModalBody>
                                <ModalFooter className="items-center">
                                    {errorMsg && (
                                        <span className="text-danger">
                                            {errorMsg}
                                        </span>
                                    )}
                                    {uploadOk ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <div className="text-sm text-emerald-400">
                                                Uploaded: {summary?.imported ?? 0}{" "}
                                                {(summary?.imported ?? 0) === 1 ? "movement" : "movements"}
                                            </div>
                                            {summary?.auto_categorised > 0 && (
                                                <div className="text-xs text-gray-400">
                                                    {summary.auto_categorised} categorised automatically with your rules.
                                                </div>
                                            )}
                                            {summary?.unknown > 0 && (
                                                <div className="text-xs text-amber-400">
                                                    {summary.unknown} arrived without a category and are in Unknown. You
                                                    can give them one in Auto-categorisation.
                                                </div>
                                            )}
                                            {summary?.skipped > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    {summary.skipped} duplicate or invalid row(s) skipped.
                                                </div>
                                            )}
                                            <Button
                                                color="success"
                                                type="button"
                                                onPress={handleCloseModal}
                                            >
                                                Upload successful!
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                            <Button
                                                color="default"
                                                type="submit"
                                                className="text-white flex-1"
                                                isDisabled={!isDropped}
                                                isLoading={loading && !autoCategorise}
                                                onClick={() => setAutoCategorise(false)}
                                                startContent={
                                                    !loading && (
                                                        <FontAwesomeIcon icon="fa-solid fa-check" />
                                                    )
                                                }
                                            >
                                                Upload
                                            </Button>
                                            <Button
                                                color="primary"
                                                type="submit"
                                                className="flex-1"
                                                isDisabled={!isDropped}
                                                isLoading={loading && autoCategorise}
                                                onClick={() => setAutoCategorise(true)}
                                                startContent={
                                                    !loading && (
                                                        <FontAwesomeIcon icon="fa-solid fa-wand-magic-sparkles" />
                                                    )
                                                }
                                            >
                                                Upload and categorise
                                            </Button>
                                        </div>
                                    )}
                                </ModalFooter>
                            </form>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
