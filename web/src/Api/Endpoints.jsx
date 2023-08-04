import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();
const API_BASE_URL = "/api";
const HEADERS = {
    headers: { Authorization: "Bearer " + cookies.get("token") },
};

const handleErrors = (error) => {
    const status = error.response.status;

    switch (status) {
        case 403:
            break;
        case 401:
            cookies.remove("token");
            window.location.href = "/login";
            break;
        default:
            break;
    }
};

const queryBuilder = (data) => {
    return Object.entries(data)
        .filter(
            ([key, value]) =>
                value !== null && value !== undefined && value !== ""
        )
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");
};

const Endpoints = {
    getVersion: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/version`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    userLogin: async (data) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/login`,
                data,
                HEADERS
            );
            var expirationDate = new Date();
            expirationDate.setTime(expirationDate.getTime() + 3600000);
            cookies.set("token", response.data.access_token, {
                path: "/",
                expires: expirationDate,
            });
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    userRegister: async (data) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/user/register`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    userLogout: async () => {
        try {
            await axios.post(`${API_BASE_URL}/user/logout`, [], HEADERS);
            cookies.remove("token");
            window.location.href = "/login";
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    userUpdate: async (data, id) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/user/${id}`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getUser: async (id = false) => {
        try {
            const param = id ? `/${id}` : "";
            const response = await axios.get(
                `${API_BASE_URL}/user${param}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getUsers: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/user/all`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    checkIfAdmin: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/user/isAdmin`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getUserSettings: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/user/settings`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    updateUserSettings: async (data) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/user/settings`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getAccounts: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/account`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getAccountById: async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/account/${id}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getAccountTypes: async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/account/type`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getCurrencies: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/account/currencies`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getUserCurrencies: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/user/currencies`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getAllCurrencies: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/user/currencies/all`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    createUserCurrency: async (data) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/user/currencies`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    updateUserCurrency: async (data, id) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/user/currencies/${id}`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    createOrUpdateAccount: async (data, account_id) => {
        try {
            const id = account_id ?? "";
            const response = await axios.post(
                `${API_BASE_URL}/account/${id}`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    accountAdjustBalance: async (data, account_id) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/account/${account_id}/adjust`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getRecords: async (account_id) => {
        try {
            let param =
                account_id > 0 ? `account/${account_id}/record` : `record`;

            const response = await axios.get(
                `${API_BASE_URL}/${param}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getPaginateRecords: async (account_id, page) => {
        try {
            let param =
                account_id > 0 ? `account/${account_id}/record` : `record`;

            param += page > 0 ? `?page=${page}` : "";

            const response = await axios.get(
                `${API_BASE_URL}/${param}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getRecordById: async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/record/${id}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getLastRecords: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/record/last?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getRecordsByCategory: async (id, from_date) => {
        try {
            const fromDate = from_date ? "?from=" + from_date : "";
            const response = await axios.get(
                `${API_BASE_URL}/record/category/${id}${fromDate}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getCategory: async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/category/${id}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    createOrUpdateCategory: async (data, category_id) => {
        try {
            const id = category_id ?? "";
            const response = await axios.post(
                `${API_BASE_URL}/category/${id}`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getParentCategories: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/category/parent`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getCategoriesByParent: async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/category/by-parent/${id}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    createRecord: async (data, record_id) => {
        try {
            const id = record_id ?? "";
            const response = await axios.post(
                `${API_BASE_URL}/record/${id}`,
                data,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    deleteRecord: async (record_id) => {
        try {
            const response = await axios.delete(
                `${API_BASE_URL}/record/${record_id}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getBalance: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getExpensesBalance: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance/expenses?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getAllBalance: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance/all?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getTimelineBalance: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance/timeline?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getIncomeCategoriesBalance: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance/categories/income?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getExpenseCategoriesBalance: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance/categories/expense?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getTopExpenses: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance/categories/top?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            return null;
        }
    },

    getSubcategoriesBalance: async (parent_category, account_id, from_date) => {
        try {
            const accountId = account_id ? `account/${account_id}` : "";
            const fromDate = from_date ? "from=" + from_date : "";
            const response = await axios.get(
                `${API_BASE_URL}/balance/subcategories/${parent_category}/${accountId}?${fromDate}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getBalanceByCategory: async (data) => {
        try {
            const queryString = queryBuilder(data);
            const response = await axios.get(
                `${API_BASE_URL}/balance/category?${queryString}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },
};

export default Endpoints;
