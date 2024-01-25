import React from "react";

import TopNav from "./TopNav";

const Layout = ({ children }) => {
  return (
    <div>
      <TopNav menu={true} />
      <div className="w-full">{children}</div>
    </div>
  );
};

export default Layout;
