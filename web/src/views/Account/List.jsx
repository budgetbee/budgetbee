import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Api from "../../Api/Endpoints";
import AccountCard from "../../Components/Account/Card";
import LeftSidebarMenu from "../../layout/LeftSidebarMenu";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faPlus } from "@fortawesome/free-solid-svg-icons";

export default function List() {
    const [isLoading, setIsLoading] = useState(true);
    const [openSidebarMenu, setOpenSidebarMenu] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        async function getAccounts() {
            const data = await Api.getAccounts();
            setData(data);
            setIsLoading(false);
        }
        getAccounts();
    }, []);

    let view = "";
    if (!isLoading) {
        view = data.map((account, index) => {
            return (
                <div key={index}>
                    <AccountCard account={account} />
                </div>
            );
        });
    }

    return (
        <div className="absolute bg-gray-800 top-0 left-0 w-full min-h-screen">
            <LeftSidebarMenu
                open={openSidebarMenu}
                setOpen={setOpenSidebarMenu}
                activePage="accounts"
            />
            <div className="fixed w-full top-0 basis-1/12 flex flex-row justify-between items-center bg-gray-700 h-14">
                <div
                    className="py-3 pl-5 cursor-pointer"
                    onClick={() => setOpenSidebarMenu(true)}
                >
                    <FontAwesomeIcon
                        icon={faBars}
                        className="text-white text-2xl"
                    />
                </div>
                <div className="py-3 pr-5 cursor-pointer">
                    <Link to="/account">
                        <FontAwesomeIcon
                            icon={faPlus}
                            className="text-white text-2xl"
                        />
                    </Link>
                </div>
            </div>
            <div className="flex flex-col divide-y divide-gray-600/50 rounded p-px mt-14">
                {view}
            </div>
        </div>
    );
}
