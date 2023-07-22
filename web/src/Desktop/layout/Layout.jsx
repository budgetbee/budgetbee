import React from "react";

import LeftSidebarMenu from "./LeftSidebarMenu";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-row bg-gray-800 text-white">
      <LeftSidebarMenu />
      <div className="w-full">{children}</div>
    </div>
  );
};

export default Layout;
