import React from "react";
import { Link } from "react-router-dom";

import Layout from "./Layout";

const SettingsLayout = ({ children }) => {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split("/");
    const activePage = pathParts[2];

    const links = {
        settings: {
            name: "Main settings",
            href: "/settings",
        },
        users: {
            name: "Users",
            href: "/settings/users",
        },
        currency: {
            name: "Currency",
            href: "/settings/currency",
        },
    };

    const linkArray = Object.entries(links);

    return (
        <Layout>
            <div className="flex flex-row gap-x-10 px-10 mt-14">
                <div className="flex flex-col gap-y-4 basis-2/12 bg-gray-700 rounded-3xl px-10 py-5 h-fit">
                    <div className="text-2xl font-bold mb-5">Settings</div>
                    <div>
                        {linkArray.map(([key, link]) => {
                            const activeClass =
                                (key === activePage || (!activePage && key === "settings")) ? "bg-gray-900" : "";
                            return (
                                <div
                                    className={`px-7 py-3 rounded-full w-fit ${activeClass}`}
                                >
                                    <Link to={link.href}>{link.name}</Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="basis-10/12">{children}</div>
            </div>
        </Layout>
    );
};

export default SettingsLayout;
