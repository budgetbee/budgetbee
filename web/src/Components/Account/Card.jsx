import React from "react";
import { Link } from "react-router-dom";
import numeral from "numeral";
// import moment from "moment";
// import "numeral/locales/es";

export default function Card({ account }) {
    const inline_style = {
        backgroundColor: account.color,
    };

    // numeral.locale("es");
    // moment.locale("es");

    return (
        <Link to={`/account/${account.id}`}>
            <div className="flex flex-row justify-between items-center bg-gray-800 text-white px-4 py-4">
                <div className="flex flex-row gap-x-4 items-center">
                    <div
                        className="w-9 h-9 rounded-full bg-gray-500"
                        style={inline_style}
                    >
                    </div>
                    <div className="flex flex-col">
                        <div className="font-bold">{account.name}</div>
                        <div className="text-white/40">
                            <strong>{account.type_name}</strong>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col font-bold text-right">
                    <div
                        className="text-green-400"
                        style={{
                            color: account.balance < 0 ? "red" : "",
                        }}
                    >
                        {numeral(account.balance).format("$0,0.00")}
                    </div>
                </div>
            </div>
        </Link>
    );
}
