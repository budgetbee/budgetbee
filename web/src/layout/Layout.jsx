import React from "react";

import TopNav from "./TopNav";
import CategorizerIntroModal from "../Components/Categorization/CategorizerIntroModal";

const Layout = ({ children }) => {
  return (
    <div>
      <TopNav menu={true} />
      <div className="w-full">{children}</div>
      {/* Shown once per user: the welcome notice for the new auto-categoriser. */}
      <CategorizerIntroModal />
    </div>
  );
};

export default Layout;
