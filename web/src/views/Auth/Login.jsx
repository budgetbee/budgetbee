import React, { useState } from "react";
import Api from "../../Api/Endpoints";
import logo from "../../assets/images/logo.png";

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const handleSendForm = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError("");
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        const ret = await Api.userLogin(formObject);
        if (ret !== null) {
            window.location = "/";
        } else {
            setFormError("Invalid credentials");
            setIsLoading(false);
        }
    };

    let button = (
        <button
            type="submit"
            className="w-full text-gray-900 bg-gradient-to-r from-teal-200 to-lime-200 hover:bg-gradient-to-l hover:from-teal-200 hover:to-lime-200 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-teal-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
        >
            Sign in
        </button>
    );

    if (isLoading) {
        button = (
            <button
                type="button"
                className="w-full text-gray-900 bg-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
            >
                <svg
                    aria-hidden="true"
                    role="status"
                    className="inline w-4 h-4 mr-3 text-gray-100 animate-spin"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="#000000"
                    />
                    <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentColor"
                    />
                </svg>
                Loading
            </button>
        );
    }

    return (
        <div>
            <section className="bg-[#F2F2DA] h-screen">
                <div className="flex flex-col items-center justify-center px-6 py-8  mx-auto md:h-screen lg:py-0">
                    <a href="/login" className="flex items-center mx-5 my-10 w-64">
                        <img className="w-full" src={logo} alt="logo"></img>
                    </a>
                    <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
                        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                                Sign in to your account
                            </h1>
                            {formError && (
                                <div
                                    className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50"
                                    role="alert"
                                >
                                    <span className="font-medium">Error</span>{" "}
                                    {formError}
                                </div>
                            )}
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
                                {button}
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
