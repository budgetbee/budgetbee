import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import {
    faChartBar,
    faMoneyCheck,
    faRobot,
    faBars,
} from "@fortawesome/free-solid-svg-icons";

import Api from "../Api/Endpoints";

export default function LeftSidebarMenu({ open, setOpen, activePage }) {
    const menuRef = useRef();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        async function getUser() {
            const data = await Api.getUser();
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
    };

    const linkArray = Object.entries(links);

    return (
        <div className={`fixed z-40 inset-0 flex ${open ? "" : "w-0"}`}>
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
                className={`transform duration-300 ease-in-out bg-black ${
                    open ? "translate-x-0" : "-translate-x-full"
                } w-64`}
                style={{ zIndex: open ? 1 : -1 }}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 bg-gray-900">
                    <h1 className="text-white text-xl font-semibold">{userName}</h1>
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
                            const activeClass = (key === activePage) ? 'bg-blue-500/30' : '';
                            return (
                                <Link key={key} to={link.href}>
                                    <li className={`flex flex-row gap-x-3 items-center px-4 py-3 cursor-pointer ${activeClass}`}>
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
            </div>
        </div>
    );
}
