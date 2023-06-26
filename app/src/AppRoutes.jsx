import React from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./views/Dashboard/View";
import AccountList from "./views/Account/List";
import AccountForm from "./views/Account/Form";
import RecordForm from "./views/Record/Form";
import RecordList from "./views/Record/List";
import CategoryForm from "./views/Category/Form";
import CategoryList from "./views/Category/List";
import Login from "./views/Auth/Login";
import Register from "./views/Auth/Register";

function AppRoutes() {

    return (
        <>
            <Routes>
                <Route exact path="/" element={<Dashboard />} />
                <Route exact path="/login" element={<Login />} />
                <Route exact path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/accounts/" element={<AccountList />} />
                <Route path="/account" element={<AccountForm />} />
                <Route path="/account/:account_id" element={<AccountForm />} />
                <Route path="/record" element={<RecordForm />} />
                <Route path="/record/list/:account_id?" element={<RecordList />} />
                <Route path="/record/:record_id" element={<RecordForm />} />
                <Route path="/category" element={<CategoryForm />} />
                <Route path="/category/list/:parent_id?" element={<CategoryList />} />
                <Route path="/category/:category_id" element={<CategoryForm />} />
            </Routes>
        </>
    );
}

export default AppRoutes;
