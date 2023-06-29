import { BrowserRouter } from "react-router-dom";
import "./App.css";

import AppRoutes from "./AppRoutes";

// Icons
import { library } from "@fortawesome/fontawesome-svg-core";
import * as Icons from "@fortawesome/free-solid-svg-icons";

const iconList = Object.keys(Icons)
    .filter((key) => key !== "fas" && key !== "prefix")
    .map((icon) => Icons[icon]);

library.add(...iconList);

function App() {
    return (
        <div className="App select-none">
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </div>
    );
}

export default App;
