import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { HeroUIProvider } from "@heroui/system";
import "./App.css";

import AppRoutes from "./AppRoutes";

// Icons
import { library } from "@fortawesome/fontawesome-svg-core";
import {
    faArrowRight,
    faArrowRightFromBracket,
    faCaretDown,
    faCaretUp,
    faCheck,
    faCloudArrowUp,
    faCoins,
    faPenToSquare,
    faPlus,
    faTrash,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

library.add(
    faArrowRight,
    faArrowRightFromBracket,
    faCaretDown,
    faCaretUp,
    faCheck,
    faCloudArrowUp,
    faCoins,
    faPenToSquare,
    faPlus,
    faTrash,
    faXmark,
);

function App() {
    return (
        <HeroUIProvider>
            <div className="App select-none">
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </div>
        </HeroUIProvider>
    );
}

export default App;
