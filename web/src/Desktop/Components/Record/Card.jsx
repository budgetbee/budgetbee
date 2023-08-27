import React from "react";
import numeral from "numeral";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FormModal from "./FormModal";
import { useDisclosure } from "@nextui-org/react";

export default function Card({ record, showName }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const inline_style = {
        backgroundColor: record.category_color,
    };

    const toAccountName = record.to_account_name
        ? " - " + record.to_account_name
        : "";
    let mainName =
        showName && record.name && record.name !== ""
            ? record.name
            : record.category_name;
    mainName = mainName.length > 25 ? mainName.slice(0, 25) + "..." : mainName;

    const handleOpenModal = () => {
        onOpenChange(true);
    };

    const modal = (
        <FormModal
            isOpen={true}
            onOpen={onOpen}
            onOpenChange={onOpenChange}
            record_id={record.id}
        />
    );

    return (
        <div
            className="flex flex-row justify-between gap-x-3 items-center bg-background text-white px-4 py-4"
            onClick={() => handleOpenModal(record)}
        >
            {isOpen && modal}
            <div className="basis-[15%]">
                <div
                    className="m-auto flex items-center justify-center w-9 h-9 rounded-full bg-gray-500"
                    style={inline_style}
                >
                    <FontAwesomeIcon icon={record.icon} />
                </div>
            </div>
            <div className="basis-[59%] flex flex-row gap-x-4 items-center">
                <div className="flex flex-col">
                    <div className={"font-bold"}>{mainName}</div>
                    <div className="text-white/40">
                        <strong>{record.account_name}</strong> {toAccountName}
                    </div>
                </div>
            </div>
            <div className="basis-[26%] flex flex-col text-right">
                <div
                    className="text-green-400"
                    style={{
                        color: record.amount < 0 ? "red" : "",
                    }}
                >
                    {record.currency_symbol}{" "}
                    {numeral(record.amount).format("0,0.00")}
                </div>
                <div className="text-white/20">
                    {moment(record.date).format("D MMMM")}
                </div>
            </div>
        </div>
    );
}
