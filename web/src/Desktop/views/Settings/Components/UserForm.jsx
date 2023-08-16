import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Api from "../../../../Api/Endpoints";
import SettingsLayout from "../../../layout/SettingsLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function UserForm() {
    const [user, setUser] = useState(null);

    const { user_id } = useParams();

    useEffect(() => {
        async function getUser() {
            const userData = await Api.getUser(user_id);
            setUser(userData);
        }
        if (user_id > 0) {
            getUser();
        }
    }, [user_id]);

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());

        if (user === null) {
            await Api.userRegister(formObject);
        } else {
            await Api.userUpdate(formObject, user.id);
        }
        window.location = "/settings";
    };

    return (
        <SettingsLayout>
            <form onSubmit={handleSaveForm}>
                <div className="w-full top-0 basis-1/12 flex flex-row justify-between items-center mb-5 h-14">
                    <div
                        onClick={() => window.history.back()}
                        className="flex flex-row px-5 py-3 gap-x-5 bg-gray-700 hover:bg-gray-500/50 rounded-full justify-between cursor-pointer items-center transition"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className={"text-white text-xl"}
                        />
                        <span>back</span>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="flex flex-row px-5 py-3 gap-x-5  bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 rounded-full justify-between cursor-pointer items-center transition"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className={"text-white text-xl"}
                            />
                            <span>save</span>
                        </button>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white py-4">
                    Basic info
                </h2>
                <div className="flex flex-col gap-y-4">
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={user && user.name}
                        ></input>
                    </div>
                </div>
                <div className="flex flex-col gap-y-4">
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            defaultValue={user && user.email}
                        ></input>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mt-8 py-4">
                    Security
                </h2>
                <div className="flex flex-col gap-y-4">
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            New password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                        ></input>
                    </div>
                </div>
                <div className="flex flex-col gap-y-4">
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block mb-2 text-sm font-medium text-gray-900 text-white"
                        >
                            Confirm password
                        </label>
                        <input
                            type="password"
                            name="confirm_password"
                            id="confirm_password"
                            className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                        ></input>
                    </div>
                </div>
            </form>
        </SettingsLayout>
    );
}
