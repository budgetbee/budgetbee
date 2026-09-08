import React from "react";

const baseUrl = () => {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    return "https://your-budgetbee-instance.com";
};

const methodClass = {
    GET: "bg-green-600",
    POST: "bg-blue-600",
    PUT: "bg-amber-600",
    DELETE: "bg-red-600",
};

function Endpoint({ method, path, description }) {
    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/60 border-b border-gray-700">
                <span
                    className={`text-white text-xs font-bold px-2 py-1 rounded ${methodClass[method]}`}
                >
                    {method}
                </span>
                <code className="text-sm text-blue-300 break-all">{path}</code>
            </div>
            <p className="px-4 py-3 text-sm text-gray-300">{description}</p>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {children}
        </div>
    );
}

export default function ApiDocs() {
    const base = baseUrl();

    return (
        <div className="space-y-8 text-sm">
            <h2 className="text-2xl font-bold">API Documentation</h2>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
                <p className="text-gray-200 leading-relaxed">
                    The BudgetBee API lets external applications read and write
                    your data. All endpoints live under{" "}
                    <code className="bg-gray-700 px-1.5 py-0.5 rounded text-blue-300">
                        /api/v1/external
                    </code>{" "}
                    and require your API key in the{" "}
                    <code className="bg-gray-700 px-1.5 py-0.5 rounded text-blue-300">
                        X-API-Key
                    </code>{" "}
                    header.
                </p>
                <pre className="mt-3 bg-black/40 rounded-lg p-3 overflow-x-auto text-xs text-gray-200">
{`curl -H "X-API-Key: YOUR_API_KEY" ${base}/api/v1/external/records`}
                </pre>
            </div>

            <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-3">
                    Notes on amounts & types
                </h3>
                <ul className="list-disc pl-5 text-gray-300 space-y-1.5">
                    <li>
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            type
                        </code>{" "}
                        is one of{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            income
                        </code>
                        ,{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            expense
                        </code>{" "}
                        or{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            transfer
                        </code>
                        . Send{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            amount
                        </code>{" "}
                        as a positive number — the API stores{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            expense
                        </code>{" "}
                        and{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            transfer
                        </code>{" "}
                        amounts as negative.
                    </li>
                    <li>
                        The account in{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            from_account_id
                        </code>{" "}
                        must belong to your user. For transfers,{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            to_account_id
                        </code>{" "}
                        and{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            rate
                        </code>{" "}
                        are required.
                    </li>
                    <li>
                        Responses are JSON. Errors return{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            404
                        </code>{" "}
                        (not found) or{" "}
                        <code className="bg-gray-700 px-1 py-0.5 rounded">
                            422
                        </code>{" "}
                        (validation).
                    </li>
                </ul>
            </div>

            <Section title="Records">
                <Endpoint
                    method="GET"
                    path="/api/v1/external/records"
                    description="List your records, newest first, paginated (20 per page). Filters (all optional): account_id, from_date, to_date, search_term, category_id, type, page, per_page."
                />
                <Endpoint
                    method="GET"
                    path="/api/v1/external/records/{id}"
                    description="Get a single record by its id."
                />
                <Endpoint
                    method="POST"
                    path="/api/v1/external/records"
                    description="Create a record. Required: date, from_account_id, type, amount. Optional: to_account_id, category_id, name, rate, code, description."
                />
                <Endpoint
                    method="PUT"
                    path="/api/v1/external/records/{id}"
                    description="Update an existing record. Required: date, from_account_id, type, amount. Optional fields as in create."
                />
                <Endpoint
                    method="DELETE"
                    path="/api/v1/external/records/{id}"
                    description="Delete a record."
                />
            </Section>

            <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-3">
                    Create a record — example
                </h3>
                <pre className="bg-black/40 rounded-lg p-3 overflow-x-auto text-xs text-gray-200">
{`curl -X POST ${base}/api/v1/external/records \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "date": "2026-09-08",
    "from_account_id": 1,
    "type": "expense",
    "category_id": 1,
    "name": "Coffee",
    "amount": 3.5,
    "rate": 1
  }'`}
                </pre>
            </div>

            <Section title="Accounts (read-only)">
                <Endpoint
                    method="GET"
                    path="/api/v1/external/accounts"
                    description="List all your accounts."
                />
                <Endpoint
                    method="GET"
                    path="/api/v1/external/accounts/{id}"
                    description="Get a single account by its id."
                />
                <Endpoint
                    method="GET"
                    path="/api/v1/external/account-types"
                    description="List the available account types."
                />
            </Section>

            <Section title="Categories (read-only)">
                <Endpoint
                    method="GET"
                    path="/api/v1/external/categories"
                    description="List your categories."
                />
                <Endpoint
                    method="GET"
                    path="/api/v1/external/categories/{id}"
                    description="Get a single category."
                />
                <Endpoint
                    method="GET"
                    path="/api/v1/external/parent-categories"
                    description="List parent categories."
                />
                <Endpoint
                    method="GET"
                    path="/api/v1/external/parent-categories/{id}"
                    description="Get a single parent category."
                />
                <Endpoint
                    method="GET"
                    path="/api/v1/external/parent-categories/{id}/categories"
                    description="List the child categories of a parent category."
                />
            </Section>
        </div>
    );
}
