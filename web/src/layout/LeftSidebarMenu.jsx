import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import Cookies from "universal-cookie";
import {
    faChartBar,
    faMoneyCheck,
    faBars,
    faGear,
} from "@fortawesome/free-solid-svg-icons";

import Api from "../Api/Endpoints";

export default function LeftSidebarMenu({ open, setOpen, activePage }) {
    const menuRef = useRef();
    const [userName, setUserName] = useState("");
    const [appVersion, setAppVersion] = useState("");
    const [appLatestVersion, setAppLatestVersion] = useState("");
    const [showVersionModal, setShowVersionModal] = useState(false);

    const cookies = new Cookies("checkVersionCheck");

    useEffect(() => {
        async function getUser() {
            const data = await Api.getUser();
            const appVersion = await Api.getVersion();
            setAppVersion(appVersion.version);
            setAppLatestVersion(appVersion.latest_version);
            if (appVersion.new_version && !cookies.get("checkVersionCheck")) {
                var expirationDate = new Date();
                expirationDate.setTime(
                    expirationDate.getTime() + 24 * 60 * 60 * 1000
                );
                cookies.set("checkVersionCheck", "true", {
                    path: "/",
                    expires: expirationDate,
                });
                setShowVersionModal(true);
            }
            setUserName(data.name);
        }
        getUser();
    }, []);

    const links = {
        dashboard: {
            name: "Dashboard",
            href: "/dashboard",
            icon: faChartBar,
            color: "text-pink-400",
        },
        accounts: {
            name: "Accounts",
            href: "/accounts",
            icon: faMoneyCheck,
            color: "text-red-400",
        },
        // rules: {
        //     name: "Rules",
        //     href: "/rule",
        //     icon: faRobot,
        //     color: "text-green-400",
        // },
        categories: {
            name: "Categories",
            href: "/category/list",
            icon: faBars,
            color: "text-orange-400",
        },
        settings: {
            name: "Settings",
            href: "/settings",
            icon: faGear,
            color: "text-gray-400",
        },
    };

    const handleLogout = async (e) => {
        e.preventDefault();
        await Api.userLogout();
    };

    const handleCloseVersionModal = async () => {
        setShowVersionModal(false);
    };

    const newVersionModal = (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50">
            <div className="flex flex-col divide-y px-5 py-3 w-11/12 bg-gray-900 text-white rounded">
                <div className="py-3 text-xl">BudgetBee has a new version!</div>
                <div className="py-3 max-h-96 overflow-auto w-full block">
                    Check the new version {appLatestVersion}{" "}
                    <a
                        className="text-blue-400"
                        target="blank"
                        href={`https://github.com/budgetbee/budgetbee/releases/tag/${appLatestVersion}`}
                    >
                        here
                    </a>
                </div>
                <div className="py-3">
                    <button
                        type="button"
                        onClick={handleCloseVersionModal}
                        className="text-white bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    const linkArray = Object.entries(links);

    return (
        <div className={`fixed z-40 inset-0 flex ${open ? "" : "w-0"}`}>
            {showVersionModal && newVersionModal}
            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black opacity-50"
                    onClick={() => setOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div
                ref={menuRef}
                className={`flex flex-col relative transform duration-300 ease-in-out bg-black ${
                    open ? "translate-x-0" : "-translate-x-full"
                } w-64`}
                style={{ zIndex: open ? 1 : -1 }}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 bg-gray-900">
                    <h1 className="text-white text-xl font-semibold">
                        {userName}
                    </h1>
                    <button
                        className="text-white"
                        onClick={() => setOpen(false)}
                    >
                        Close
                    </button>
                </div>

                {/* Menu Options */}
                <nav className="py-4 text-white text-md">
                    <ul>
                        {linkArray.map(([key, link]) => {
                            const activeClass =
                                key === activePage ? "bg-blue-500/30" : "";
                            return (
                                <Link key={key} to={link.href}>
                                    <li
                                        className={`flex flex-row gap-x-3 items-center px-4 py-3 cursor-pointer ${activeClass}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={link.icon}
                                            className={`basis-1/5 text-lg ${link.color}`}
                                        />
                                        <span className="font-semibold">
                                            {link.name}
                                        </span>
                                    </li>
                                </Link>
                            );
                        })}
                    </ul>
                </nav>
                <div className="flex flex-col gap-y-2 px-7 py-4 text-white absolute bottom-5 w-full">
                    <button
                        className="flex items-center gap-x-2"
                        onClick={handleLogout}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" />
                        <span>Logout</span>
                    </button>
                    <small className="text-gray-300">
                        Version: {appVersion}
                    </small>
                </div>
            </div>
        </div>
    );
}
