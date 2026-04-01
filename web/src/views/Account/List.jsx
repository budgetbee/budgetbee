import React, { useEffect, useState } from "react";
import Api from "../../Api/Endpoints";
import AccountCard from "../../Components/Account/Card";
import TopNav from "../../layout/TopNav";
import { faPlus, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function List() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragSnapshot, setDragSnapshot] = useState(null);

    useEffect(() => {
        async function getAccounts() {
            const accounts = await Api.getAccounts();
            setData(accounts);
            setIsLoading(false);
        }
        getAccounts();
    }, []);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        setDragSnapshot([...data]);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedIndex === null || draggedIndex === index) return;

        const reordered = [...data];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(index, 0, removed);
        setDraggedIndex(index);
        setData(reordered);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const newOrder = data.map((a) => a.id);
        setDraggedIndex(null);
        const result = await Api.reorderAccounts({ accounts: newOrder });
        if (result?.error) {
            setData(dragSnapshot);
        }
        setDragSnapshot(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    let view = "";
    if (!isLoading) {
        view = data.map((account, index) => {
            return (
                <div
                    key={account.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    className={`flex flex-row items-center${draggedIndex === index ? " opacity-50" : ""}`}
                >
                    <div className="px-3 py-4 text-gray-400 cursor-grab active:cursor-grabbing">
                        <FontAwesomeIcon icon={faGripVertical} />
                    </div>
                    <div className="grow">
                        <AccountCard account={account} />
                    </div>
                </div>
            );
        });
    }

    const handleAddNewClick = () => {
        window.location.href = '/account';
    };

    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            <TopNav menu={true} rightFunction={handleAddNewClick} rightIcon={faPlus} />
            <div className="flex flex-col divide-y divide-gray-600/50 rounded p-px mt-14">
                {view}
            </div>
        </div>
    );
}
