import React from "react";
import { Link } from "react-router-dom";

import Layout from "./Layout";

const SettingsLayout = ({ children }) => {

    // const currentPath = window.location.pathname;
    // const pathParts = currentPath.split("/");
    // const firstParam = pathParts[2];

    const activeClass = "font-bold bg-blue-500/50";

    return (
        <Layout>
            <div className="flex flex-row gap-x-10 px-10 mt-14">
                <div className="flex flex-col gap-y-4 basis-2/12 bg-gray-700 rounded-3xl px-10 py-5 h-fit">
                    <div className="text-2xl font-bold mb-5">Settings</div>
                    <div className={`px-10 py-4 rounded-full w-fit ${activeClass}`}>
                        <Link to="/settings">Users</Link>
                    </div>
                </div>
                <div className="basis-10/12">{children}</div>
            </div>
        </Layout>
    );
};

export default SettingsLayout;
