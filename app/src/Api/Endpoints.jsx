import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_HOST;
const HEADERS = { headers: { Authorization: 'Bearer ' + sessionStorage.getItem("token") } };

const handleErrors = (error) => {
    const status = error.response.status;

    switch (status) {
        case 403:
            alert("403");
            break;
        case 401:
            sessionStorage.removeItem("token");
            window.location.href = "/login";
            break;
        default:
            alert("Error generico");
            break;
    }
};

const Endpoints = {
    userLogin: async (data) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/login`,
                data,
                HEADERS
            );
            sessionStorage.setItem("token", response.data.access_token);
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
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

    getAccountStocks: async (id) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/account/${id}/stocks`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
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

    getLastRecords: async (number, account_id) => {
        try {
            let param =
                account_id > 0
                    ? `account/${account_id}/record/last${number}`
                    : `record/last${number}`;

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

    getBalance: async (account_id, from_date) => {
        try {
            const id = account_id ?? "";
            const fromDate = from_date ? "?from=" + from_date : "";
            const response = await axios.get(
                `${API_BASE_URL}/balance/${id}${fromDate}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getExpensesBalance: async (account_id, from_date) => {
        try {
            const id = account_id ?? "";
            const fromDate = from_date ? "?from=" + from_date : "";
            const response = await axios.get(
                `${API_BASE_URL}/balance/expenses/${id}${fromDate}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getTimelineBalance: async (account_id, from_date) => {
        try {
            const id = account_id ?? "";
            const fromDate = from_date ? "?from=" + from_date : "";
            const response = await axios.get(
                `${API_BASE_URL}/balance/timeline/${id}${fromDate}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
            return null;
        }
    },

    getCategoriesBalance: async (account_id, from_date) => {
        try {
            const id = account_id ?? "";
            const fromDate = from_date ? "from=" + from_date : "";
            const response = await axios.get(
                `${API_BASE_URL}/balance/categories/${id}?${fromDate}`,
                HEADERS
            );
            return response.data;
        } catch (error) {
            handleErrors(error);
            console.error(error);
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

    getBalanceByCategory: async (account_id, from_date) => {
        try {
            const id = account_id ? "account/" + account_id : "";
            const fromDate = from_date ? "?from=" + from_date : "";
            const response = await axios.get(
                `${API_BASE_URL}/balance/category/${id}${fromDate}`,
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
