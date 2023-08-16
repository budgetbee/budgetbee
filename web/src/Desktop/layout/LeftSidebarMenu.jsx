import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import Cookies from "universal-cookie";
import {
    faChartBar,
    faMoneyCheck,
    faBars,
    faGear,
} from "@fortawesome/free-solid-svg-icons";
import Api from "../../Api/Endpoints";
import logo from "../../assets/images/logo_color_1.svg";

export default function LeftSidebarMenu() {
    const [appVersion, setAppVersion] = useState("");
    const [appLatestVersion, setAppLatestVersion] = useState("");
    const [showVersionModal, setShowVersionModal] = useState(false);

    const cookies = new Cookies("checkVersionCheck");

    const currentPath = window.location.pathname;
    const pathParts = currentPath.split("/");
    const activePage = pathParts[1];

    useEffect(() => {
        async function getUser() {
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
        <div className="fixed z-50 inset-0 flex flex-col items-center justify-center bg-black/50">
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
        <div className={`flex h-screen relative block`}>
            {showVersionModal && newVersionModal}

            <div className="relative h-screen w-72"></div>

            {/* Sidebar */}
            <div
                className={`fixed flex flex-col transform h-screen duration-300 ease-in-out bg-gray-900 w-72`}
            >
                <div className="px-4 pt-10 pb-5">
                    <img className="px-5" src={logo} alt="logo" />
                </div>
                
                {/* Menu Options */}
                <nav className="py-4 text-white text-md">
                    <Link to="/record" className="block px-14 py-5">
                        <div className="flex flex-row px-5 font-bold py-3 gap-x-5 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 rounded-full justify-center cursor-pointer items-center transition">
                            <FontAwesomeIcon
                                icon="fa-solid fa-check"
                                className={`basis-1/5 text-lg `}
                            />
                            <span className="font-semibold">New record</span>
                        </div>
                    </Link>
                    <ul>
                        {linkArray.map(([key, link]) => {
                            const activeClass =
                                key === activePage ? "bg-blue-500/30" : "";
                            return (
                                <Link key={key} to={link.href}>
                                    <li
                                        className={`flex flex-row gap-x-3 items-center px-4 py-3 cursor-pointer ${activeClass} hover:bg-gray-700/50`}
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
