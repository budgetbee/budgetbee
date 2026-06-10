import * as React from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react";
import "./App.css";

import AppRoutes from "./AppRoutes";
import ChatBot from "./Components/ChatBot/ChatBot";
import { useSessionManager } from "./hooks/useSessionManager";

// Icons
import { library } from "@fortawesome/fontawesome-svg-core";
import * as Icons from "@fortawesome/free-solid-svg-icons";

const iconList = Object.keys(Icons)
    .filter((key) => key !== "fas" && key !== "prefix")
    .map((icon) => Icons[icon]);

library.add(...iconList);

/** Only renders ChatBot on authenticated pages (not login/register/setup) */
function ConditionalChatBot() {
    const location = useLocation();
    const authPaths = ["/login", "/register", "/setup"];
    if (authPaths.some((p) => location.pathname.startsWith(p))) {
        return null;
    }
    return <ChatBot />;
}

function App() {
    useSessionManager();

    return (
        <NextUIProvider>
            <div className="App select-none">
                <BrowserRouter>
                    <AppRoutes />
                    <ConditionalChatBot />
                </BrowserRouter>
            </div>
        </NextUIProvider>
    );
}

export default App;
