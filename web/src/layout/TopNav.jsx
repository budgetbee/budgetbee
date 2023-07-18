import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBars } from "@fortawesome/free-solid-svg-icons";

import LeftSidebarMenu from "./LeftSidebarMenu";

export default function TopNav({
    menu = false,
    leftFunction,
    leftIcon,
    rightFunction,
    rightIcon,
}) {
    const [openSidebarMenu, setOpenSidebarMenu] = useState(false);
    const [activePage, setActivePage] = useState("");

    useEffect(() => {
        // Get the active page from the URL's first parameter
        const url = window.location.href;
        const segments = url.split("/");
        const activePageFromUrl = segments[3]; // Assuming the active page is the 3rd segment of the URL

        setActivePage(activePageFromUrl);
    }, []);

    const handleLeftClick = () => {
        if (menu) {
            setOpenSidebarMenu(true);
        } else if (leftFunction) {
            leftFunction();
        } else {
            window.history.back();
        }
    };

    const handleRightClick = () => {
        if (rightFunction) {
            rightFunction();
        } else {
            window.history.back();
        }
    };

    if (menu) {
        leftIcon = faBars;
    }

    return (
        <div className="fixed w-full top-0 basis-1/12 flex flex-row justify-between items-center bg-gray-700 h-14 z-30">
            <LeftSidebarMenu
                open={openSidebarMenu}
                setOpen={setOpenSidebarMenu}
                activePage={activePage}
            />
            <div
                className="py-3 pl-5 pr-10 cursor-pointer"
                onClick={handleLeftClick}
            >
                <FontAwesomeIcon
                    icon={leftIcon || faArrowLeft}
                    className="text-white text-2xl"
                />
            </div>
            {rightFunction && (
                <div
                    className="py-3 pr-5 pl-10 cursor-pointer"
                    onClick={handleRightClick}
                >
                    <FontAwesomeIcon
                        icon={rightIcon}
                        className="text-white text-2xl"
                    />
                </div>
            )}
        </div>
    );
}
