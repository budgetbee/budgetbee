import React from "react";
import { useDropzone } from "react-dropzone";

export default function Dropzone({ setSelectedFile, setIsDropped }) {
    const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
        useDropzone({
            multiple: false,
            accept: {
                "application/vnd.ms-excel": [".xls"],
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                "application/json": [".json"],
            },
        });

    if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setIsDropped(true);
    }

    const file = acceptedFiles.map((file) => (
        <p className="text-xl pt-3" key={file.path}>
            {file.path}
        </p>
    ));

    return (
        <section className="container">
            <div {...getRootProps({ className: "dropzone" })}>
                <input name="file" {...getInputProps()} />
                {isDragActive ? (
                    <p>Drop the file here ...</p>
                ) : (
                    <div className="max-w-xl">
                        <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                            <span className="flex items-center space-x-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6 text-gray-600"
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
                                <span className="font-medium text-gray-600">
                                    Drop file to Attach, or{" "}
                                    <span className="text-blue-600 underline">
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
