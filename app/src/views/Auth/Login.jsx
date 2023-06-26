import { React, useState } from "react";

import Api from "../../Api/Endpoints";
import logo from "./logo.png";

// Icons
export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [formValues, setFormValues] = useState(null);

    const handleSendForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        setFormValues(formObject);
        await Api.userLogin(formObject);
        window.location = "/";
    };

    if (isLoading) {
        return <>asdf</>;
    }

    return (
        <div>
            <section className="bg-[#ddffc2] h-screen">
                <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                    <a
                        href="#"
                        className="flex items-center mx-5 my-10 text-2xl font-semibold text-white"
                    >
                        <img className="w-full" src={logo} alt="logo"></img>
                    </a>
                    <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
                        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                                Sign in to your account
                            </h1>
                            <form
                                className="space-y-4 md:space-y-6"
                                onSubmit={handleSendForm}
                            >
                                <div>
                                    <label
                                        for="email"
                                        className="block mb-2 text-sm font-medium text-gray-900"
                                    >
                                        Your email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                        placeholder="your@email.com"
                                        required=""
                                    ></input>
                                </div>
                                <div>
                                    <label
                                        for="password"
                                        className="block mb-2 text-sm font-medium text-gray-900"
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        placeholder="••••••••"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                        required=""
                                    ></input>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="remember"
                                                aria-describedby="remember"
                                                type="checkbox"
                                                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                                                required=""
                                            ></input>
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label
                                                for="remember"
                                                className="text-gray-500"
                                            >
                                                Remember me
                                            </label>
                                        </div>
                                    </div>
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-primary-600 hover:underline"
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                                <button type="submit" class="w-full text-gray-900 bg-gradient-to-r from-teal-200 to-lime-200 hover:bg-gradient-to-l hover:from-teal-200 hover:to-lime-200 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-teal-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">Sign in</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
