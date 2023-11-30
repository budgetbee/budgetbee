import React, { useState } from "react";
import numeral from "numeral";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Api from "../../../Api/Endpoints";
import FormModal from "./FormModal";
import { useDisclosure } from "@nextui-org/react";

export default function Card({ record, showName }) {
    const [recordData, setRecordData] = useState(record);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const inline_style = {
        backgroundColor: recordData.category_color,
    };

    const toAccountName = (recordData.type === 'transfer' && recordData.to_account_name)
        ? " - " + recordData.to_account_name
        : "";
    let mainName =
        showName && recordData.name && recordData.name !== ""
            ? recordData.name
            : recordData.category_name;
    mainName = mainName.length > 25 ? mainName.slice(0, 25) + "..." : mainName;

    const handleOpenModal = () => {
        onOpenChange(true);
    };

    const fetchAgain = async (recordId) => {
        const newRecordData = await Api.getRecordById(recordId);
        setRecordData(newRecordData);
    };

    const modal = (
        <FormModal
            isOpen={true}
            onOpen={onOpen}
            onOpenChange={onOpenChange}
            record_id={record.id}
            fetchAgain={() => fetchAgain(record.id)}
        />
    );

    return (
        <>
            {isOpen && modal}
            <div
                className="flex flex-row justify-between gap-x-3 items-center bg-background text-white px-4 py-4 cursor-pointer hover:bg-gray-700 transition"
                onClick={() => handleOpenModal(recordData)}
            >
                <div className="basis-[15%]">
                    <div
                        className="m-auto flex items-center justify-center w-9 h-9 rounded-full bg-gray-500"
                        style={inline_style}
                    >
                        <FontAwesomeIcon icon={recordData.icon} />
                    </div>
                </div>
                <div className="basis-[59%] flex flex-row gap-x-4 items-center">
                    <div className="flex flex-col">
                        <div className={"font-bold"}>{mainName}</div>
                        <div className="text-white/40">
                            <strong>{recordData.account_name}</strong>{" "}
                            {toAccountName}
                        </div>
                    </div>
                </div>
                <div className="basis-[26%] flex flex-col text-right">
                    <div
                        className="text-green-400"
                        style={{
                            color: recordData.amount < 0 ? "red" : "",
                        }}
                    >
                        {recordData.currency_symbol}{" "}
                        {numeral(recordData.amount).format("0,0.00")}
                    </div>
                    <div className="text-white/20">
                        {moment(recordData.date).format("D MMMM")}
                    </div>
                </div>
            </div>
        </>
    );
}
