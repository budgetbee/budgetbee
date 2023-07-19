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
    right2Function,
    right2Icon,
}) {
    const [openSidebarMenu, setOpenSidebarMenu] = useState(false);
    const [activePage, setActivePage] = useState("");

    useEffect(() => {
        const url = window.location.href;
        const segments = url.split("/");
        const activePageFromUrl = segments[3];

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
        rightFunction();
    };

    const handleRight2Click = () => {
        right2Function();
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
            <div className="flex flex-row gap-x-2">
                {rightFunction && (
                    <div
                        className="py-3 px-5 cursor-pointer"
                        onClick={handleRightClick}
                    >
                        <FontAwesomeIcon
                            icon={rightIcon}
                            className="text-white text-2xl"
                        />
                    </div>
                )}
                {right2Function && (
                    <div
                        className="py-3 px-5 cursor-pointer"
                        onClick={handleRight2Click}
                    >
                        <FontAwesomeIcon
                            icon={right2Icon}
                            className="text-white text-2xl"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
