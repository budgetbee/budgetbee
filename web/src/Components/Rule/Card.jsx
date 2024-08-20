import React from "react";
import moment from "moment";
import RuleFormButton from "./RuleFormButton";

export default function Card({ rule, updatedCallback }) {

    return (
        <div className="flex flex-row justify-between gap-x-3 items-center bg-gray-800 text-white px-4 py-4">
            <div className="basis-[59%] flex flex-row gap-x-4 items-center">
                <div className="flex flex-col">
                    <div className={"font-bold"}>{rule.name}</div>
                    <div className="text-white/40">
                        {moment(rule.created_at).format("D MMMM YYYY")}
                    </div>
                </div>
                <RuleFormButton rule={rule} updatedCallback={updatedCallback} />
            </div>
        </div>
    );
}