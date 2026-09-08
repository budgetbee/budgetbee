import * as React from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react";
import "./App.css";

import AppRoutes from "./AppRoutes";
import ChatBot from "./Components/ChatBot/ChatBot";
import BottomMenu from "./layout/BottomMenu";
import { useSessionManager } from "./hooks/useSessionManager";

// Icons
import { library } from "@fortawesome/fontawesome-svg-core";
import * as Icons from "@fortawesome/free-solid-svg-icons";

const iconList = Object.keys(Icons)
    .filter((key) => key !== "fas" && key !== "prefix")
    .map((icon) => Icons[icon]);

library.add(...iconList);

/**
 * Routes where the floating AI chat must not appear. The chat belongs on
 * dashboard/list screens; on auth pages and on data-entry screens (record,
 * account, category and loan forms, plus their pickers/overlays) the floating
 * button would cover inputs and get in the way.
 */
function isChatbotHidden(pathname) {
    if (["/login", "/register", "/setup"].some((p) => pathname.startsWith(p))) {
        return true;
    }
    // Record form/create/edit (/record, /record/:id) hidden; list stays visible.
    if (pathname.startsWith("/record")) {
        return !pathname.startsWith("/record/list");
    }
    // Account form (/account, /account/:id) hidden; accounts list visible.
    if (pathname.startsWith("/account")) {
        return !pathname.startsWith("/accounts");
    }
    // Category form (/category, /category/:id) hidden; category list visible.
    if (pathname.startsWith("/category")) {
        return !pathname.startsWith("/category/list");
    }
    // Loan detail/form (/loan/*) hidden; loans list visible.
    if (pathname.startsWith("/loan")) {
        return !pathname.startsWith("/loans");
    }
    return false;
}

/** Renders the mobile floating UI (BottomMenu pill + AI chat) only on pages
 *  where it makes sense: auth pages and data-entry screens are excluded. */
function ConditionalFloatingUI() {
    const location = useLocation();
    const hidden = isChatbotHidden(location.pathname);
    return (
        <>
            <BottomMenu hidden={hidden} />
            <ChatBot hidden={hidden} />
        </>
    );
}

function App() {
    useSessionManager();

    return (
        <NextUIProvider>
            <div className="App select-none">
                <BrowserRouter>
                    <AppRoutes />
                    <ConditionalFloatingUI />
                </BrowserRouter>
            </div>
        </NextUIProvider>
    );
}

export default App;
