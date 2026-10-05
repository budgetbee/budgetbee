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
    const [autoCategorise, setAutoCategorise] = useState(false);
    const [summary, setSummary] = useState(null);
    // Set when the file does not follow the standard format: then the user is
    // asked what each column holds before anything is imported.
    const [inspection, setInspection] = useState(null);
    const [mappingOpen, setMappingOpen] = useState(false);
    // Reading the file again after the user says which row is the header.
    const [inspecting, setInspecting] = useState(false);

    const buildFormData = (autoCategoriseFlag, mapping, accountId, skipRows) => {
        const formData = new FormData();
        // The real FormData goes to the API: a plain object would be JSON
        // serialized and the file would never arrive.
        formData.append("file", selectedFile, selectedFile.name);
        formData.append("auto_categorise", autoCategoriseFlag ? "1" : "0");
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

    const doImport = async (autoCategoriseFlag, mapping = null, accountId = null, skipRows = null) => {
        const response = await Api.importRecords(
            buildFormData(autoCategoriseFlag, mapping, accountId, skipRows)
        );

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

        // First read the file: a standard file imports straight away, any other
        // one (a bank export, for instance) asks for the columns.
        const inspectionResponse = await Api.inspectImport(buildFormData(false));

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

        await doImport(autoCategorise);
    };

    const handleMappingConfirm = async (mapping, accountId, categorise, skipRows = []) => {
        setLoading(categorise ? "categorise" : "plain");
        setMappingOpen(false);
        await doImport(categorise, mapping, accountId, skipRows);
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
        const response = await Api.inspectImport(buildFormData(false, null, null, skipRows));
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
                                            href="/import/csvTemplate.csv"
                                            download="csv_template.csv"
                                        >
                                            <Button
                                                color="default"
                                                className="text-white"
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
                                        Upload your movements in CSV, JSON, XLS or XLSX. You can use
                                        the file your bank gives you: if its columns are not the
                                        standard ones, we will show you what we found in them so you
                                        can say what each column holds, and we will remember it for
                                        the next time.
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        A movement without a category is accepted: it is kept as
                                        Unknown. Use Upload and categorise and the app will look for
                                        the best category with your own rules and what it has already
                                        learned. Movements that already bring a category are
                                        respected and are never changed.
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
                                            {summary?.rows_left_out > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    {summary.rows_left_out} line(s) of the file were left
                                                    out, as you asked.
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
                                                isLoading={loading === true && !autoCategorise}
                                                onClick={() => setAutoCategorise(false)}
                                                startContent={
                                                    loading !== true && (
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
                                                isLoading={loading === true && autoCategorise}
                                                onClick={() => setAutoCategorise(true)}
                                                startContent={
                                                    loading !== true && (
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
