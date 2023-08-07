import React from "react";
import numeral from "numeral";

export default function CardMini({ account, isGray }) {
    const bgColor = isGray ? "#505050" : account.color
    const inline_style = {
        backgroundColor: bgColor,
    };

    // numeral.locale("es");

    return (
        <div
            className={`font-bold flex flex-col py-1 px-2 h-12 rounded-lg text-white cursor-pointer`}
            style={inline_style}
        >
            <div className="text-sm text-white/70 h-7 overflow-hidden">
                {account.name}
            </div>
            <div>{account.currency_symbol} {numeral(account.balance).format("0,0.00")}</div>
        </div>
    );
}
