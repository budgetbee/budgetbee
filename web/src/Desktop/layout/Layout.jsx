import React from "react";

import LeftSidebarMenu from "./LeftSidebarMenu";
import CategorizerIntroModal from "../../Components/Categorization/CategorizerIntroModal";

const Layout = ({ children, onRecordChange }) => {
  return (
    <div className="flex flex-row bg-gradient-to-b from-[#26344a] via-[#1F2937] to-[#151c29] text-white">
      <LeftSidebarMenu onRecordChange={onRecordChange} />
      <div className="w-full">{children}</div>
      {/* Shown once per user: the welcome notice for the new auto-categoriser. */}
      <CategorizerIntroModal />
    </div>
  );
};

export default Layout;
