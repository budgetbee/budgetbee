import axios from "axios";
import Cookies from "universal-cookie";

const cookies = new Cookies();
const API_BASE_URL = "/api";
const HEADERS = {
    headers: { Authorization: "Bearer " + cookies.get("token") },
};

const handleErrors = (error) => {
    const status = error.response.status;

    let message;
    switch (status) {
        case 401:
            cookies.remove("token");
            window.location.href = "/login";
            break;
        case 404:
            message = "Not Found";
            break;
        default:
            message = error.response.data.error;
            break;
    }

    return { error: message };
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

async function call(method, endpoint, data = null) {
    const options = {
        method: method,
        url: `${API_BASE_URL}/${endpoint}`,
        headers: {
            Authorization: "Bearer " + cookies.get("token"),
        },
    };

    if (method.toLowerCase() === "post" && data) {
        options.data = data;

        if (data.file) {
            options.headers["Content-Type"] = "multipart/form-data";
        } else {
            options.headers["Content-Type"] = "application/json";
        }
    }

    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        return handleErrors(error);
    }
}

const get = (endpoint) => {
    return call("get", endpoint);
};

const post = (endpoint, data) => {
    return call("post", endpoint, data);
};

const del = (endpoint) => {
    return call("delete", endpoint);
};

const Endpoints = {
    getVersion: async () => {
        return get("version");
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
            return null;
        }
    },

    userRegister: async (data) => {
        return post(`user/register`, data);
    },

    userLogout: async () => {
        post(`user/logout`, []);
        cookies.remove("token");
        window.location.href = "/login";
    },

    userUpdate: async (data, id) => {
        return post(`user/${id}`, data);
    },

    getUser: async (id = "") => {
        const user_id = id ?? "";
        return get(`user/${user_id}`);
    },

    getUsers: async () => {
        return get("user/all");
    },

    checkIfAdmin: async () => {
        return get("user/isAdmin");
    },

    getUserSettings: async () => {
        return get("user/settings");
    },

    updateUserSettings: async (data) => {
        return post(`user/settings`, data);
    },

    getAccounts: async () => {
        return get("account");
    },

    getAccountById: async (id) => {
        return get(`account/${id}`);
    },

    getAccountTypes: async (id) => {
        return get("account/type");
    },

    getCurrencies: async () => {
        return get("account/currencies");
    },

    getUserCurrencies: async () => {
        return get("user/currencies");
    },

    getAllCurrencies: async () => {
        return get("user/currencies/all");
    },

    createUserCurrency: async (data) => {
        return post("user/currencies", data);
    },

    updateUserCurrency: async (data, id) => {
        return post(`user/currencies/${id}`, data);
    },

    createOrUpdateAccount: async (data, account_id) => {
        const id = account_id ?? "";
        return post(`account/${id}`, data);
    },

    accountAdjustBalance: async (data, account_id) => {
        return post(`account/${account_id}/adjust`, data);
    },

    getRecords: async (account_id) => {
        const endpoint =
            account_id > 0 ? `account/${account_id}/record` : `record`;
        return get(endpoint);
    },

    getPaginateRecords: async (account_id, page) => {
        let endpoint =
            account_id > 0 ? `account/${account_id}/record` : `record`;
        endpoint += page > 0 ? `?page=${page}` : "";
        return get(endpoint);
    },

    getRecordById: async (id) => {
        return get(`record/${id}`);
    },

    getLastRecords: async (data) => {
        const queryString = queryBuilder(data);
        return get(`record/last?${queryString}`);
    },

    getRecordsByCategory: async (id, from_date) => {
        const fromDate = from_date ? "?from=" + from_date : "";
        return get(`record/category/${id}${fromDate}`);
    },

    getCategory: async (id) => {
        return get(`category/${id}`);
    },

    getCategories: async () => {
        return get(`category`);
    },

    createOrUpdateCategory: async (data, category_id) => {
        const id = category_id ?? "";
        return post(`category/${id}`, data);
    },

    getParentCategories: async () => {
        return get(`category/parent`);
    },

    getCategoriesByParent: async (id) => {
        return get(`category/by-parent/${id}`);
    },

    createRecord: async (data, record_id) => {
        const id = record_id ?? "";
        return post(`record/${id}`, data);
    },

    deleteRecord: async (record_id) => {
        return del(`record/${record_id}`);
    },

    getBalance: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance?${queryString}`);
    },

    getExpensesBalance: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance/expenses?${queryString}`);
    },

    getAllBalance: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance/all?${queryString}`);
    },

    getTimelineBalance: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance/timeline?${queryString}`);
    },

    getIncomeCategoriesBalance: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance/categories/income?${queryString}`);
    },

    getExpenseCategoriesBalance: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance/categories/expense?${queryString}`);
    },

    getTopExpenses: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance/categories/top?${queryString}`);
    },

    getSubcategoriesBalance: async (parent_category, account_id, from_date) => {
        const accountId = account_id ? `account/${account_id}` : "";
        const fromDate = from_date ? "from=" + from_date : "";
        return get(
            `balance/subcategories/${parent_category}/${accountId}?${fromDate}`
        );
    },

    getBalanceByCategory: async (data) => {
        const queryString = queryBuilder(data);
        return get(`balance/category?${queryString}`);
    },

    importRecords: async (data) => {
        return post(`import`, data);
    },
};

export default Endpoints;
