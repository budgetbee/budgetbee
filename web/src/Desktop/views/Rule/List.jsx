import React, { useEffect, useState } from "react";

import Api from "../../../Api/Endpoints";
import Layout from "../../layout/Layout";
import RuleFormButton from '../../../Components/Rule/RuleFormButton';

export default function List() {
    const [data, setData] = useState([]);

    async function getRules() {
        const rules = await Api.getRules();
        setData(rules);
    }

    useEffect(() => {
        getRules();
    }, []);

    const handleUpdateList = () => {
        getRules();
    }

    const view = data.length ? data.map((rule) => {
        return (
            <tr
                key={rule.id}
                className="border-b bg-background border-gray-700"
            >
                <th
                    scope="row"
                    className="flex flex-row items-center gap-x-2 px-6 py-4 font-medium whitespace-nowrap text-white"
                >
                    #{rule.id}
                </th>
                <th
                    scope="row"
                    className="px-6 py-4 font-medium whitespace-nowrap text-white"
                >
                    {rule.explanation}
                </th>
                <td className="px-6 py-4 text-right">
                    <RuleFormButton rule={rule} updatedCallback={handleUpdateList} />
                </td>
            </tr>
        );
    }) : '';

    return (
        <Layout>
            <div className="px-5 mt-10">
                <div>
                    <RuleFormButton updatedCallback={handleUpdateList} />
                </div>
                <table className="w-full mt-5 text-sm text-left text-gray-400">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                Rule
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Description
                            </th>
                            <th scope="col" className="px-6 py-3">

                            </th>
                        </tr>
                    </thead>
                    <tbody>{view}</tbody>
                </table>
            </div>
        </Layout>
    );
}