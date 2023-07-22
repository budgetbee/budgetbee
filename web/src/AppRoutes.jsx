import React from "react";
import { Routes, Route } from "react-router-dom";
import { isMobile } from "react-device-detect";

import Dashboard from "./views/Dashboard/View";
import AccountList from "./views/Account/List";
import AccountForm from "./views/Account/Form";
import RecordForm from "./views/Record/Form";
import RecordList from "./views/Record/List";
import CategoryForm from "./views/Category/Form";
import CategoryList from "./views/Category/List";
import Settings from "./views/Settings/Settings";
import SettingsUserForm from "./views/User/UserForm";

import DashboardDesktop from "./Desktop/views/Dashboard/View";
import AccountsDesktop from "./Desktop/views/Account/View";
import AccountFormDesktop from "./Desktop/views/Account/Form";
import RecordFormDesktop from "./Desktop/views/Record/Form";
import RecordListDesktop from "./Desktop/views/Record/List";
import CategoryListDesktop from "./Desktop/views/Category/List";
import SettingsUserList from "./Desktop/views/Settings/UserList";
import SettingsUserFormDesktop from "./Desktop/views/User/UserForm";

import Login from "./views/Auth/Login";

function AppRoutes() {

    return (
        <>
            <Routes>
                <Route exact path="/" element={isMobile ? <Dashboard /> : <DashboardDesktop />} />
                <Route exact path="/login" element={<Login />} />
                <Route path="/dashboard" element={isMobile ? <Dashboard /> : <DashboardDesktop />} />
                <Route path="/accounts/" element={isMobile ? <AccountList /> : <AccountsDesktop />} />
                <Route path="/account" element={isMobile ? <AccountForm /> : <AccountFormDesktop />} />
                <Route path="/account/:account_id" element={isMobile ? <AccountForm /> : <AccountFormDesktop />} />
                <Route path="/record" element={isMobile ? <RecordForm /> : <RecordFormDesktop />} />
                <Route path="/record/list/:account_id?" element={isMobile ? <RecordList /> : <RecordListDesktop />} />
                <Route path="/record/:record_id" element={isMobile ? <RecordForm /> : <RecordFormDesktop />} />
                <Route path="/category" element={isMobile ? <CategoryForm /> : <CategoryListDesktop />} />
                <Route path="/category/list/:parent_id?" element={isMobile ? <CategoryList /> : <CategoryListDesktop />} />
                <Route path="/category/:category_id" element={isMobile ? <CategoryForm /> : <CategoryListDesktop />} />
                <Route path="/settings" element={isMobile ? <Settings /> : <SettingsUserList />} />
                <Route path="/settings/user/:user_id?" element={isMobile ? <SettingsUserForm /> : <SettingsUserFormDesktop />} />
            </Routes>
        </>
    );
}

export default AppRoutes;
