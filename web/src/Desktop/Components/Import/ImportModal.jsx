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

    const handleUploadFile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        const formData = new FormData(e.target);
        formData.append("file", selectedFile, selectedFile.name);
        const formObject = Object.fromEntries(formData.entries());
        const response = await Api.importRecords(formObject);

        if (response.error) {
            setErrorMsg(response.error);
        } else {
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
                                        <Button
                                            color="success"
                                            type="button"
                                            onPress={handleCloseModal}
                                        >
                                            Upload successful!
                                        </Button>
                                    ) : (
                                        <Button
                                            color="primary"
                                            type="submit"
                                            isDisabled={!isDropped}
                                            isLoading={loading}
                                            startContent={
                                                !loading && (
                                                    <FontAwesomeIcon icon="fa-solid fa-check" />
                                                )
                                            }
                                        >
                                            Upload
                                        </Button>
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
