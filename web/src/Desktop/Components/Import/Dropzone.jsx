import React from "react";
import { useDropzone } from "react-dropzone";

// The importer takes files up to 10MB (the API says so too). Checking here means
// the user is told at once, without sending 30MB over the network to be rejected.
const MAX_BYTES = 10 * 1024 * 1024;
const TOO_BIG =
    "That file is bigger than the 10 MB the importer takes. Split the export (for example, one file per month) and try again.";
const BAD_TYPE =
    "That file type cannot be read. Upload a CSV, an Excel file (XLS, XLSX) or a JSON one.";

export default function Dropzone({ setSelectedFile, setIsDropped, setErrorMsg }) {
    const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
        useDropzone({
            multiple: false,
            maxSize: MAX_BYTES,
            // A file that is too big or of a type we do not read is not silently
            // ignored: the reason is shown where the errors are shown.
            onDropRejected: (rejections) => {
                const code = rejections?.[0]?.errors?.[0]?.code;
                setErrorMsg?.(code === "file-too-large" ? TOO_BIG : BAD_TYPE);
                setSelectedFile(null);
                setIsDropped(false);
            },
            // Bank statements are CSV most of the time, and browsers do not
            // agree on its type: text/csv normally, application/csv, and on
            // Windows it is reported as application/vnd.ms-excel. The ".csv"
            // extension is what really lets the file through (react-dropzone
            // matches extensions by suffix and mime types exactly); the aliases
            // are there so the file picker also shows CSV on every system.
            // text/plain is deliberately NOT listed: it would make every .txt
            // look acceptable.
            accept: {
                "text/csv": [".csv"],
                "application/csv": [".csv"],
                "application/vnd.ms-excel": [".xls", ".csv"],
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                "application/json": [".json"],
            },
        });

    if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setIsDropped(true);
        setErrorMsg?.(null);
    }

    const file = acceptedFiles.map((file) => (
        <p className="pt-3 text-sm text-gray-300" key={file.path}>
            {file.path}
        </p>
    ));

    return (
        <section className="container">
            <div {...getRootProps({ className: "dropzone" })}>
                <input name="file" {...getInputProps()} />
                {isDragActive ? (
                    <p className="text-gray-300">Drop the file here ...</p>
                ) : (
                    <div className="max-w-xl">
                        <label className="flex justify-center w-full h-32 px-4 transition bg-[#12121f] border-2 border-gray-700 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-gray-500 focus:outline-none">
                            <span className="flex items-center space-x-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <span className="font-medium text-gray-300">
                                    Drop your file here, or{" "}
                                    <span className="text-blue-400 underline">
                                        browse
                                    </span>
                                </span>
                            </span>
                        </label>
                    </div>
                )}
            </div>
            <aside>
                <div>{file}</div>
            </aside>
        </section>
    );
}
