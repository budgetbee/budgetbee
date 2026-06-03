import React from "react";

import TopNav from "./TopNav";
import ChatBot from "../Components/ChatBot/ChatBot";

const Layout = ({ children }) => {
  return (
    <div>
      <TopNav menu={true} />
      <div className="w-full">{children}</div>
      <ChatBot />
    </div>
  );
};

export default Layout;
