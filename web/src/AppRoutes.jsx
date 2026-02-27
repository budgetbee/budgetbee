import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { isMobile } from "react-device-detect";

const Dashboard = lazy(() => import("./views/Dashboard/View"));
const Budget = lazy(() => import("./views/Budget/BudgetDashboard"));
const AccountList = lazy(() => import("./views/Account/List"));
const AccountForm = lazy(() => import("./views/Account/Form"));
const RecordForm = lazy(() => import("./views/Record/Form"));
const RecordList = lazy(() => import("./views/Record/List"));
const CategoryForm = lazy(() => import("./views/Category/Form"));
const CategoryList = lazy(() => import("./views/Category/List"));
const Settings = lazy(() => import("./views/Settings/Settings"));
const SettingsUserForm = lazy(() => import("./views/User/UserForm"));

const DashboardDesktop = lazy(() => import("./Desktop/views/Dashboard/View"));
const AccountsDesktop = lazy(() => import("./Desktop/views/Account/View"));
const BudgetDesktop = lazy(() => import("./Desktop/views/Budget/BudgetDashboard"));
const RecordFormDesktop = lazy(() => import("./Desktop/views/Record/Form"));
const RecordListDesktop = lazy(() => import("./Desktop/views/Record/List"));
const CategoryListDesktop = lazy(() => import("./Desktop/views/Category/List"));
const BaseSettings = lazy(() => import("./Desktop/views/Settings/BaseSettings"));
const SettingsUserList = lazy(() => import("./Desktop/views/Settings/UserList"));
const SettingsUserFormDesktop = lazy(() => import("./Desktop/views/Settings/Components/UserForm"));
const CurrencySettingsDesktop = lazy(() => import("./Desktop/views/Settings/CurrencySettings"));

const Login = lazy(() => import("./views/Auth/Login"));

function AppRoutes() {

    return (
        <>
            <Suspense fallback={null}>
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
            </Suspense>
        </>
    );
}

export default AppRoutes;
