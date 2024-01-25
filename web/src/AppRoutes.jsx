import React from "react";
import { Routes, Route } from "react-router-dom";
import { isMobile } from "react-device-detect";

import Dashboard from "./views/Dashboard/View";
import Budget from "./views/Budget/BudgetDashboard";
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
import BudgetDesktop from "./Desktop/views/Budget/BudgetDashboard";
import RecordFormDesktop from "./Desktop/views/Record/Form";
import RecordListDesktop from "./Desktop/views/Record/List";
import CategoryListDesktop from "./Desktop/views/Category/List";
import BaseSettings from "./Desktop/views/Settings/BaseSettings";
import SettingsUserList from "./Desktop/views/Settings/UserList";
import SettingsUserFormDesktop from "./Desktop/views/Settings/Components/UserForm";
import CurrencySettingsDesktop from "./Desktop/views/Settings/CurrencySettings";

import Login from "./views/Auth/Login";

function AppRoutes() {

    return (
        <>
            <Routes>
                <Route exact path="/" element={isMobile ? <Dashboard /> : <DashboardDesktop />} />
                <Route exact path="/login" element={<Login />} />
                <Route path="/dashboard" element={isMobile ? <Dashboard /> : <DashboardDesktop />} />
                <Route path="/budget" element={isMobile ? <Budget /> : <BudgetDesktop />} />
                <Route path="/accounts/" element={isMobile ? <AccountList /> : <AccountsDesktop />} />
                <Route path="/account" element={<AccountForm />} />
                <Route path="/account/:account_id" element={<AccountForm />} />
                <Route path="/record" element={isMobile ? <RecordForm /> : <RecordFormDesktop />} />
                <Route path="/record/list/:account_id?" element={isMobile ? <RecordList /> : <RecordListDesktop />} />
                <Route path="/record/:record_id" element={isMobile ? <RecordForm /> : <RecordFormDesktop />} />
                <Route path="/category" element={isMobile ? <CategoryForm /> : <CategoryListDesktop />} />
                <Route path="/category/list/:parent_id?" element={isMobile ? <CategoryList /> : <CategoryListDesktop />} />
                <Route path="/category/:category_id" element={isMobile ? <CategoryForm /> : <CategoryListDesktop />} />
                <Route path="/settings" element={isMobile ? <Settings /> : <BaseSettings />} />
                <Route path="/settings/users" element={isMobile ? <Settings /> : <SettingsUserList />} />
                <Route path="/settings/users/new" element={isMobile ? <SettingsUserForm /> : <SettingsUserFormDesktop />} />
                <Route path="/settings/users/:user_id?" element={isMobile ? <SettingsUserForm /> : <SettingsUserFormDesktop />} />
                <Route path="/settings/currency" element={isMobile ? <CurrencySettingsDesktop /> : <CurrencySettingsDesktop />} />
            </Routes>
        </>
    );
}

export default AppRoutes;
