import React from "react";

import LeftSidebarMenu from "./LeftSidebarMenu";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-row bg-background text-white">
      <LeftSidebarMenu />
      <div className="w-full">{children}</div>
    </div>
  );
};

export default Layout;
