import { React } from "react";
import { Link } from "react-router-dom";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faCarSide } from "@fortawesome/free-solid-svg-icons";

function MainNav() {
    return (
        <div className="fixed bottom-0 z-40 bg-white w-full h-16 border-t">
            <div className="relative h-full flex flex-row justify-around text-center">
                <div className={"self-center h-8 grow text-[#bec2ce]"}>
                    <Link to='/'>
                        <FontAwesomeIcon
                            icon={faHouse}
                            className={"text-3xl"}
                        />
                    </Link>
                </div>
                <div className={"self-center h-8 grow text-[#bec2ce]"}>
                    <Link to='/vehicles'>
                        <FontAwesomeIcon
                            icon={faCarSide}
                            className={"text-3xl"}
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default MainNav;
