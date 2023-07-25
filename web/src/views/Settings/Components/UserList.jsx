import { React, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Api from "../../../Api/Endpoints";
import Loader from "../../../Components/Miscellaneous/Loader";

export default function UserList() {
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function getUsers() {
            const data = await Api.getUsers();
            const admin = await Api.checkIfAdmin();
            setUsers(data);
            setIsAdmin(admin.is_admin);
            setIsLoading(false);
        }
        getUsers();
    }, []);

    let view = "";
    if (!isLoading) {
        view = users.map((user, index) => {
            return (
                <tr
                    key={index}
                    className="border-b bg-gray-800 border-gray-700"
                >
                    <th
                        scope="row"
                        className="px-6 py-4 font-medium whitespace-nowrap text-white"
                    >
                        {user.name}
                    </th>
                    <td className="px-6 py-4 text-right">
                        <Link to={"/settings/users/" + user.id}>
                            <button
                                type="button"
                                className="text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2"
                            >
                                Edit
                            </button>
                        </Link>
                    </td>
                </tr>
            );
        });
    }

    return (
        <div className="mt-20 px-2 m-auto relative">
            <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            User
                        </th>
                        <th scope="col" className="px-6 py-3 text-right">
                            {isAdmin && (
                                <Link to={"/settings/users/new"}>
                                    <button
                                        type="button"
                                        className="text-gray-900 bg-[#F2F2DA] hover:bg-[#F2F2DA] focus:outline-none focus:ring-4 focus:ring-[#F2F2DA] font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2"
                                    >
                                        Add
                                    </button>
                                </Link>
                            )}
                        </th>
                    </tr>
                </thead>
                <tbody>{view}</tbody>
            </table>
            {isLoading && <Loader classes="w-10 mt-5" />}
        </div>
    );
}
