import React from "react";

import LeftSidebarMenu from "./LeftSidebarMenu";
import ChatBot from "../../Components/ChatBot/ChatBot";

const Layout = ({ children, onRecordChange }) => {
  return (
    <div className="flex flex-row bg-background text-white">
      <LeftSidebarMenu onRecordChange={onRecordChange} />
      <div className="w-full">{children}</div>
      <ChatBot />
    </div>
  );
};

export default Layout;
