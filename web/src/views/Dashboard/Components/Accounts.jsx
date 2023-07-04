import { React, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { FreeMode, Pagination } from "swiper";

import Api from "../../../Api/Endpoints";
import AccountCardMini from "../../../Components/Account/CardMini";

export default function Accounts({ activeAccount, setActiveAccount }) {
    const [isLoading, setIsLoading] = useState(true);
    const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        async function getAccounts() {
            const data = await Api.getAccounts();
            setData(data);
            setIsLoading(false);
        }
        getAccounts();
    }, [activeAccount]);

    const handleClick = (id) => {
        let check = id == activeAccount ? null : id;
        setActiveAccount(check);
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());
        await Api.accountAdjustBalance(formObject, activeAccount);
        setActiveAccount(null);
        setAdjustBalanceOpen(false);
    };

    if (isLoading) {
        return <></>;
    }

    const adjustBalance = (
        <div
            className="w-fit m-auto px-4 my-2 py-2 border border-indigo-300 rounded text-indigo-300"
            onClick={() => setAdjustBalanceOpen(true)}
        >
            ADJUST
        </div>
    );

    const adjustBalanceForm = (
        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-40">
            <div
                className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-10"
                onClick={() => setAdjustBalanceOpen(false)}
            ></div>
            <form onSubmit={handleSaveForm}>
                <div className="flex flex-col gap-y-4 relative z-20 bg-gray-200 p-5 rounded">
                    <input
                        type="number"
                        name="balance"
                        id="balance"
                        class="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                        step="any"
                    ></input>

                    <button
                        type="submit"
                        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                    >
                        SAVE
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="rounded p-2 max-w-full block">
            {adjustBalanceOpen && adjustBalanceForm}
            <Swiper
                spaceBetween={10}
                slidesPerView={3.5}
                freeMode={true}
                modules={[FreeMode, Pagination]}
            >
                {data.map((account, index) => {
                    let isGray =
                        activeAccount != null && activeAccount !== account.id;
                    return (
                        <SwiperSlide key={index}>
                            <div onClick={() => handleClick(account.id)}>
                                <AccountCardMini
                                    account={account}
                                    isGray={isGray}
                                />
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
            {activeAccount && adjustBalance}
        </div>
    );
}
