import React from "react";

import UserList from "./Components/UserList";
import BaseSettings from "./Components/BaseSettings";
import TopNav from "../../layout/TopNav";

export default function Settings() {
    return (
        <div className="absolute bg-background top-0 left-0 w-full min-h-screen">
            <TopNav menu={true} />
            <UserList />
            <BaseSettings />
        </div>
    );
}
