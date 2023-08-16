import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Api from "../../Api/Endpoints";
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
    });

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());

        if (user === null) {
            await Api.userRegister(formObject);
        }
        else {
            await Api.userUpdate(formObject, user.id);
        }
        window.location = "/settings";
    };

    return (
        <div className="min-h-screen bg-background">
            <form onSubmit={handleSaveForm}>
                <div className="fixed w-full top-0 basis-1/12 flex flex-row justify-between items-center bg-gray-700 mb-5 h-14">
                    <div
                        onClick={() => window.history.back()}
                        className="py-3 pl-5 pr-10 cursor-pointer"
                    >
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            className={"text-white text-2xl"}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="py-3 pl-10 pr-5 cursor-pointer"
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                className={"text-white text-2xl"}
                            />
                        </button>
                    </div>
                </div>
                <h2 className="px-5 text-2xl font-bold text-white mt-14 py-4">
                    Basic info
                </h2>
                <div className="flex flex-col gap-y-4 px-5">
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
                <div className="flex flex-col gap-y-4 px-5">
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
                <h2 className="px-5 text-2xl font-bold text-white mt-8 py-4">
                    Security
                </h2>
                <div className="flex flex-col gap-y-4 px-5">
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
                <div className="flex flex-col gap-y-4 px-5">
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
        </div>
    );
}
