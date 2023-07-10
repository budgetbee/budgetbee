import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Api from "../../Api/Endpoints";
import TopNav from "../../layout/TopNav";
import Loader from "../../Components/Miscellaneous/Loader";

export default function Form() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    const { rule_id } = useParams();

    useEffect(() => {
        async function getRule() {
            const rule = await Api.getRule(rule_id);
            setData(rule);
            setIsLoading(false);
        }
        getRule();
    }, []);

    let conditions;

    let conditionCount = 0;
    if (data !== null) {
        conditions = (
            <div className="flex flex-col gap-y-5">
                {data.conditions.map((condition, index) => {
                    conditionCount++;
                    return (
                        <div
                            key={index}
                            className="w-full flex flex-col gap-y-2"
                        >
                            <p className="text-white">
                                Condition {conditionCount}
                            </p>
                            <select
                                name=""
                                id=""
                                className="w-full px-2 py-3 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                <option
                                    value={condition.rule_condition_type_id}
                                >
                                    {condition.type_name}
                                </option>
                            </select>
                            <div>
                                <input
                                    type="text"
                                    name=""
                                    id=""
                                    value={condition.condition}
                                    className="w-full px-2 py-2 bg-gray-200 text-gray-700 rounded-lg"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    let actions;

    let actionCount = 0;
    if (data !== null) {
        actions = (
            <div className="flex flex-col gap-y-5">
                {data.actions.map((action, index) => {
                    actionCount++;
                    return (
                        <div
                            key={index}
                            className="w-full flex flex-col gap-y-2"
                        >
                            <p className="text-white">
                                Action {actionCount}
                            </p>
                            <select
                                name=""
                                id=""
                                className="w-full px-2 py-3 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                <option
                                    value={action.rule_action_type_id}
                                >
                                    {action.type_name}
                                </option>
                            </select>
                            <div>
                                <input
                                    type="text"
                                    name=""
                                    id=""
                                    value={action.action}
                                    className="w-full px-2 py-2 bg-gray-200 text-gray-700 rounded-lg"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="absolute bg-gray-800 top-0 left-0 w-full min-h-screen">
            <TopNav />
            <div className="mt-14 flex flex-col divide-y divide-gray-600/50 rounded p-px px-5">
                <div className="py-10">{conditions}</div>
                <div className="py-10">{actions}</div>
                {isLoading && <Loader classes="w-10 my-5" />}
            </div>
        </div>
    );
}
