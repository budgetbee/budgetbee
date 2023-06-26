import React from "react";
import { Link } from "react-router-dom";
import numeral from "numeral";
import moment from "moment";
import "numeral/locales/es";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Card({ record, showName }) {
    const inline_style = {
        backgroundColor: record.category_color,
    };

    numeral.locale("es");
    moment.locale("es");

    const toAccountName = record.to_account_name
        ? " - " + record.to_account_name
        : "";
    let mainName =
        showName && record.name != "" ? record.name : record.category_name;
    mainName = mainName.length > 25 ? mainName.slice(0, 25) + "..." : mainName;
    return (
        <Link to={`/record/${record.id}`}>
            <div className="flex flex-row justify-between gap-x-3 items-center bg-gray-800 text-white px-4 py-4">
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
                            <strong>{record.account_name}</strong>{" "}
                            {toAccountName}
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
                        {numeral(record.amount).format("0,0.[00]")} €
                    </div>
                    <div className="text-white/20">
                        {moment(record.date).format("D MMMM")}
                    </div>
                </div>
            </div>
        </Link>
    );
}
