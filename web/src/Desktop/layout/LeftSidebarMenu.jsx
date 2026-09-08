import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import Cookies from "universal-cookie";
import {
    faChartBar,
    faMoneyCheck,
    faBars,
    faGear,
    faSackDollar,
    faCalendarDays,
    faChartPie,
    faList,
    faHandHoldingDollar,
    faHeart,
    faBug
} from "@fortawesome/free-solid-svg-icons";
import Api from "../../Api/Endpoints";
import RecordModalButton from "../Components/Record/RecordModalButton";
import ImportModal from "../Components/Import/ImportModal";
import logo from "../../assets/images/logo_color_1.svg";

export default function LeftSidebarMenu({ onRecordChange }) {
    const [appVersion, setAppVersion] = useState("");
    const [appLatestVersion, setAppLatestVersion] = useState("");
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [releaseInfo, setReleaseInfo] = useState(null);
    const [releaseError, setReleaseError] = useState("");

    const fetchReleaseInfo = async (version) => {
        const tag = version?.startsWith("v") ? version : `v${version}`;
        setReleaseError("");
        setReleaseInfo(null);
        try {
            const res = await fetch(
                `https://api.github.com/repos/budgetbee/budgetbee/releases/tags/${tag}`
            );
            if (!res.ok) {
                setReleaseError("No release found for this version.");
                return;
            }
            const data = await res.json();
            setReleaseInfo({ name: data.name || tag, body: data.body || "" });
        } catch (e) {
            setReleaseError("Could not load the release notes.");
        }
        setShowReleaseModal(true);
    };

    
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split("/");
    const activePage = pathParts[1];
    
    useEffect(() => {
        const cookies = new Cookies("checkVersionCheck");
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
        budgets: {
            name: "Budgets",
            href: "/budget",
            icon: faSackDollar,
            color: "text-green-400",
        },
        loans: {
            name: "Loans",
            href: "/loans",
            icon: faHandHoldingDollar,
            color: "text-yellow-400",
        },
        upcoming: {
            name: "Upcoming",
            href: "/upcoming",
            icon: faCalendarDays,
            color: "text-blue-400",
        },
        reports: {
            name: "Reports",
            href: "/reports",
            icon: faChartPie,
            color: "text-purple-400",
        },
        record: {
            name: "Records",
            href: "/record/list",
            icon: faList,
            color: "text-blue-400",
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

    const releaseModal = showReleaseModal && (
        <div className="fixed z-50 inset-0 flex flex-col items-center justify-center bg-black/50">
            <div className="flex flex-col px-5 py-4 w-1/2 max-h-[80vh] bg-gray-900 text-white rounded">
                <div className="py-2 text-xl font-semibold border-b border-gray-700">
                    Release {releaseInfo?.name || appVersion}
                </div>
                <div className="py-3 overflow-auto whitespace-pre-wrap text-sm break-words">
                    {releaseError || releaseInfo?.body || "No release notes."}
                </div>
                <div className="flex gap-2 py-2">
                    <a
                        className="text-white bg-indigo-700 hover:bg-indigo-600 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                        target="_blank"
                        rel="noreferrer"
                        href="https://github.com/budgetbee/budgetbee/releases"
                    >
                        View all versions
                    </a>
                    <button
                        type="button"
                        onClick={() => setShowReleaseModal(false)}
                        className="text-white bg-gray-700 hover:bg-gray-600 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

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
            {releaseModal}

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
                    <div className="flex flex-col gap-y-3 mx-14 my-4">
                        <div className="w-full">
                            <RecordModalButton onRecordChange={onRecordChange} />
                        </div>
                        <div className="w-full">
                            <ImportModal />
                        </div>
                    </div>
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
                    <div className="flex gap-x-4">
                        <a
                            className="flex items-center gap-x-2 hover:text-pink-400"
                            href="https://github.com/sponsors/Pelukosa"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FontAwesomeIcon icon={faHeart} />
                            <span>Support</span>
                        </a>
                        <a
                            className="flex items-center gap-x-2 hover:text-yellow-400"
                            href="https://github.com/budgetbee/budgetbee/issues/new"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FontAwesomeIcon icon={faBug} />
                            <span>Feedback</span>
                        </a>
                    </div>
                    <button
                        className="flex items-center gap-x-2"
                        onClick={handleLogout}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" />
                        <span>Logout</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fetchReleaseInfo(appVersion)}
                        className="text-left text-gray-300 underline decoration-dotted underline-offset-4 hover:text-white"
                        title="View release notes"
                    >
                        Version: {appVersion}
                    </button>
                </div>
            </div>
        </div>
    );
}
