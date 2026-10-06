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
import ColumnMappingModal from "./ColumnMappingModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";

export default function ImportModal() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [loading, setLoading] = useState(false);
    const [isDropped, setIsDropped] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [uploadOk, setUploadOk] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [summary, setSummary] = useState(null);
    // Set when the file does not follow the standard format: then the user is
    // asked what each column holds before anything is imported.
    const [inspection, setInspection] = useState(null);
    const [mappingOpen, setMappingOpen] = useState(false);
    // Reading the file again after the user says which row is the header.
    const [inspecting, setInspecting] = useState(false);
    // The old way of importing (the downloadable templates), kept for whoever
    // was already working like that: this screen is now the new importer by
    // default, and that one is only reached on purpose.
    const [legacy, setLegacy] = useState(false);

    const buildFormData = (mapping, accountId, skipRows) => {
        const formData = new FormData();
        // The real FormData goes to the API: a plain object would be JSON
        // serialized and the file would never arrive.
        formData.append("file", selectedFile, selectedFile.name);
        // Categorising is not optional any more: a movement that arrives
        // without a category is looked up with the user's own rules and what
        // the app has already learned. The ones that bring a category are
        // respected. Turning it off will live in the settings.
        formData.append("auto_categorise", "1");
        if (mapping) {
            formData.append("mapping", JSON.stringify(mapping));
        }
        if (accountId) {
            formData.append("account_id", accountId);
        }
        // Rows of the file the user left out on screen: the holder, the balance,
        // a total at the end. Numbered as they are in their file.
        if (skipRows && skipRows.length > 0) {
            formData.append("skip_rows", JSON.stringify(skipRows));
        }
        return formData;
    };

    const doImport = async (mapping = null, accountId = null, skipRows = null) => {
        const response = await Api.importRecords(buildFormData(mapping, accountId, skipRows));

        if (response?.error) {
            setErrorMsg(response.error);
        } else {
            setSummary(response);
            setUploadOk(true);
        }
        setLoading(false);
    };

    const handleUploadFile = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        // First read the file: a file that already follows the standard format
        // imports straight away, any other one (a bank export, for instance)
        // asks for the columns.
        const inspectionResponse = await Api.inspectImport(buildFormData());

        if (inspectionResponse?.error) {
            setErrorMsg(inspectionResponse.error);
            setLoading(false);
            return;
        }

        if (!inspectionResponse?.standard) {
            setInspection(inspectionResponse);
            setMappingOpen(true);
            setLoading(false);
            return;
        }

        await doImport();
    };

    const handleMappingConfirm = async (mapping, accountId, categorise, skipRows = []) => {
        setLoading(true);
        setMappingOpen(false);
        await doImport(mapping, accountId, skipRows);
    };

    // The user said which row is the header: the file is read again leaving out
    // everything above it, so the header search lands where they said and the
    // table is rebuilt with their header and their lines.
    const handleReinspect = async (skipRows) => {
        if (!selectedFile) {
            return;
        }
        setInspecting(true);
        setErrorMsg(null);
        const response = await Api.inspectImport(buildFormData(null, null, skipRows));
        setInspecting(false);

        if (response?.error) {
            setErrorMsg(response.error);
            return;
        }
        setInspection(response);
    };

    const handleCloseModal = () => {
        setUploadOk(false);
        setSelectedFile(null);
        setIsDropped(false);
        setSummary(null);
        setInspection(null);
        setMappingOpen(false);
        setLoading(false);
        setErrorMsg(null);
        setLegacy(false);
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
                classNames={{
                    base: "bg-[#0a0a0f]",
                    content: "bg-[#0a0a0f]",
                    closeButton: "text-gray-400 hover:bg-[#1a1a2e]",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <form onSubmit={handleUploadFile}>
                                <ModalHeader className="flex flex-col gap-1">
                                    {legacy ? (
                                        <div className="flex flex-row gap-x-2">
                                            <a
                                                href="/import/excelTemplate.xlsx"
                                                download="excel_template.xlsx"
                                            >
                                                <Button
                                                    variant="flat"
                                                    className="bg-[#1a1a2e] text-gray-300 hover:bg-[#2a2a3e]"
                                                    type="button"
                                                >
                                                    Excel template
                                                </Button>
                                            </a>
                                            <a
                                                href="/import/csvTemplate.csv"
                                                download="csv_template.csv"
                                            >
                                                <Button
                                                    variant="flat"
                                                    className="bg-[#1a1a2e] text-gray-300 hover:bg-[#2a2a3e]"
                                                    type="button"
                                                >
                                                    CSV template
                                                </Button>
                                            </a>
                                            <a
                                                href="/import/jsonTemplate.json"
                                                download="json_template.json"
                                            >
                                                <Button
                                                    variant="flat"
                                                    className="bg-[#1a1a2e] text-gray-300 hover:bg-[#2a2a3e]"
                                                    type="button"
                                                >
                                                    Json template
                                                </Button>
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-normal text-gray-400">
                                            Drop the file your bank gives you (CSV, JSON, Excel): the
                                            importer reads it and finds the columns by itself, and if
                                            it is not sure it asks you to check them.
                                        </span>
                                    )}
                                </ModalHeader>
                                <ModalBody>
                                    {legacy && (
                                        <p className="text-xs text-gray-400">
                                            Upload your movements in CSV, JSON, XLS or XLSX using the
                                            standard format of the templates.
                                        </p>
                                    )}
                                    <Dropzone
                                        setSelectedFile={setSelectedFile}
                                        setIsDropped={setIsDropped}
                                        setErrorMsg={setErrorMsg}
                                    />
                                </ModalBody>
                                <ModalFooter className="flex flex-col items-stretch gap-2">
                                    <div className="flex w-full items-center gap-2">
                                        {errorMsg && (
                                            <span className="mr-auto text-xs text-danger">
                                                {errorMsg}
                                            </span>
                                        )}
                                        {uploadOk ? (
                                            <Button
                                                type="button"
                                                variant="flat"
                                                className="w-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-medium"
                                                onPress={handleCloseModal}
                                            >
                                                Close
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                className="w-full bg-green-500 text-white hover:bg-green-600 font-medium"
                                                isDisabled={!isDropped}
                                                isLoading={loading}
                                                startContent={
                                                    !loading && (
                                                        <FontAwesomeIcon icon="fa-solid fa-cloud-arrow-up" />
                                                    )
                                                }
                                            >
                                                Upload
                                            </Button>
                                        )}
                                    </div>

                                    {uploadOk ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            {summary?.already_there ? (
                                                // Importing the same file twice is not an
                                                // error: nothing was duplicated.
                                                <div className="text-sm text-gray-300">
                                                    Nothing new:{" "}
                                                    {(summary?.duplicates ?? 0) === 1
                                                        ? "that movement is already in your account"
                                                        : `those ${summary?.duplicates ?? 0} movements are already in your account`}
                                                    . Nothing was duplicated.
                                                </div>
                                            ) : (
                                                <div className="text-sm text-emerald-400">
                                                    Uploaded: {summary?.imported ?? 0}{" "}
                                                    {(summary?.imported ?? 0) === 1 ? "movement" : "movements"}
                                                </div>
                                            )}
                                            {summary?.auto_categorised > 0 && (
                                                <div className="text-xs text-gray-400">
                                                    {summary.auto_categorised} categorised automatically with your rules.
                                                </div>
                                            )}
                                            {summary?.unknown > 0 && (
                                                <div className="text-xs text-gray-400">
                                                    {summary.unknown} arrived without a category and are in Unknown. You
                                                    can give them one in Auto-categorisation.
                                                </div>
                                            )}
                                            {summary?.rows_left_out > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    {summary.rows_left_out} line(s) of the file were left
                                                    out, as you asked.
                                                </div>
                                            )}
                                            {!summary?.already_there && summary?.skipped > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    {summary.skipped} row(s) skipped
                                                    {summary.duplicates > 0
                                                        ? ` (${summary.duplicates} already in the account)`
                                                        : " (unreadable)"}
                                                    .
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="self-start text-xs text-gray-500 underline hover:text-gray-300"
                                            onClick={() => {
                                                setLegacy(!legacy);
                                                setErrorMsg(null);
                                            }}
                                        >
                                            {legacy
                                                ? "Back to the new importer"
                                                : "Import the old way (legacy)"}
                                        </button>
                                    )}
                                </ModalFooter>
                            </form>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Only shown when the file columns are not the standard ones. */}
            <ColumnMappingModal
                isOpen={mappingOpen}
                onClose={() => setMappingOpen(false)}
                inspection={inspection}
                loading={loading}
                errorMsg={errorMsg}
                onConfirm={handleMappingConfirm}
                onReinspect={handleReinspect}
                inspecting={inspecting}
            />
        </>
    );
}
