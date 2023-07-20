import React from "react";

import UserList from "./Components/UserList";
import TopNav from "../../../layout/TopNav";

export default function Settings() {

    return (
        <div className="absolute bg-gray-800 top-0 left-0 w-full min-h-screen">
            <TopNav menu={true} />
            <UserList />
        </div>
    );
}
