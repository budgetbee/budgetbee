import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

import Accounts from "./Components/Accounts";
import LastRecords from "./Components/LastRecords";
import BalanceChart from "./Components/BalanceChart";
import CategoryRecords from "./Components/CategoryRecords";
import CategoryChart from "./Components/CategoryChart";
import LeftSidebarMenu from "../../layout/LeftSidebarMenu";
import FloatMenu from "../../layout/FloatMenu";

export default function Dashboard() {
    const [activeAccount, setActiveAccount] = useState(null);
    const [openSidebarMenu, setOpenSidebarMenu] = useState(false);

    return (
        <div>
            <LeftSidebarMenu
                open={openSidebarMenu}
                setOpen={setOpenSidebarMenu}
                activePage="dashboard"
            />
            <div className="fixed w-full top-0 basis-1/12 flex flex-row justify-left items-center bg-gray-700 h-14">
                <div
                    className="py-3 pl-5 pr-10 cursor-pointer"
                    onClick={() => setOpenSidebarMenu(true)}
                >
                    <FontAwesomeIcon
                        icon={faBars}
                        className="text-white text-2xl"
                    />
                </div>
            </div>
            <div className="flex flex-col gap-y-4 bg-black px-3 py-5 mt-14 pt-4">
                <FloatMenu />
                <div>
                    <Accounts
                        activeAccount={activeAccount}
                        setActiveAccount={setActiveAccount}
                    />
                </div>
                <div>
                    <BalanceChart activeAccount={activeAccount} />
                </div>
                <div>
                    <CategoryChart activeAccount={activeAccount} />
                </div>
                <div>
                    <CategoryRecords activeAccount={activeAccount} />
                </div>
                <div>
                    <LastRecords activeAccount={activeAccount} />
                </div>
            </div>
        </div>
    );
}
