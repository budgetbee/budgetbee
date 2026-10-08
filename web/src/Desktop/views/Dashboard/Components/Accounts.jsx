import React, { useEffect, useState } from "react";
import numeral from "numeral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Api from "../../../../Api/Endpoints";
import DashboardCard from "./DashboardCard";

/**
 * Decide si el texto va en blanco o en gris oscuro segun el brillo del color de
 * la cuenta. Sobre un fondo claro el blanco no se lee, y al reves.
 */
function textoLegible(color) {
    const hex = (color || "").replace("#", "");
    if (hex.length !== 6) {
        return { principal: "text-white", secundario: "text-white/80" };
    }
    const canales = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    // Luminancia relativa de la WCAG: 0 es negro y 1 es blanco.
    const luminancia = canales
        .map((v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        })
        .reduce((total, v, i) => total + v * [0.2126, 0.7152, 0.0722][i], 0);
    // A partir de este brillo el fondo se considera claro y el texto va en gris
    // oscuro. El corte esta alto a proposito: en un color saturado (rojo, azul,
    // magenta) el blanco es lo que se espera y se lee bien, asi que el gris se
    // reserva para fondos de verdad claros, como un amarillo o un verde vivo.
    return luminancia > 0.3
        ? { principal: "text-gray-900", secundario: "text-gray-700" }
        : { principal: "text-white", secundario: "text-white/80" };
}

export default function Accounts({ activeAccount, setSearchData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false);
    const [data, setData] = useState([]);

    useEffect(() => {
        let cancelled = false;
        async function getAccounts() {
            const accounts = await Api.getAccounts();
            if (!cancelled) {
                setData(Array.isArray(accounts) ? accounts : []);
                setIsLoading(false);
            }
        }
        getAccounts();
        return () => {
            cancelled = true;
        };
    }, [activeAccount]);

    // The filter may hold one account or several; both are treated the same way.
    const activeIds = Array.isArray(activeAccount)
        ? activeAccount
        : activeAccount
        ? [activeAccount]
        : [];

    const handleClick = (id) => {
        const next = activeIds.includes(id)
            ? activeIds.filter((value) => value !== id)
            : [...activeIds, id];

        setSearchData((prevData) => {
            const nextData = { ...prevData, _refresh: Date.now() };
            if (next.length === 0) {
                delete nextData.account_id;
            } else {
                nextData.account_id = next;
            }
            return nextData;
        });
    };

    const handleSaveForm = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formObject = Object.fromEntries(formData.entries());
        await Api.accountAdjustBalance(formObject, activeIds[0]);
        const accounts = await Api.getAccounts();
        setData(Array.isArray(accounts) ? accounts : []);
        setSearchData((prevData) => ({ ...prevData, _refresh: Date.now() }));
        setAdjustBalanceOpen(false);
    };

    if (isLoading) {
        return null;
    }

    const adjustBalance = (
        <button
            type="button"
            onClick={() => setAdjustBalanceOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-700 bg-[#0a0a0f] px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
            <FontAwesomeIcon icon="fa-solid fa-sliders" />
            Adjust balance
        </button>
    );

    const adjustBalanceForm = (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/60"
                onClick={() => setAdjustBalanceOpen(false)}
            ></div>
            <form
                onSubmit={handleSaveForm}
                className="relative z-20 w-80 rounded-2xl border border-gray-700 bg-[#2c3a50] p-5"
            >
                <div className="text-lg font-semibold text-white">Adjust balance</div>
                <input
                    type="number"
                    name="balance"
                    id="balance"
                    step="any"
                    className="mt-4 block w-full rounded-2xl border border-gray-700 bg-[#0a0a0f] px-3 py-2 text-white focus:border-emerald-500/40 focus:outline-none transition-colors"
                ></input>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setAdjustBalanceOpen(false)}
                        className="rounded-2xl px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-2xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <DashboardCard title="Accounts" icon="fa-solid fa-money-check" tone="blue">
            {adjustBalanceOpen && adjustBalanceForm}
            <div className="mt-4 flex flex-col gap-y-2 max-h-96 overflow-y-auto pr-1">
                {data.map((account) => {
                    const isActive = activeIds.includes(account.id);
                    const isDimmed = activeIds.length > 0 && !isActive;
                    // El fondo vuelve a ser el color de la cuenta y el texto se
                    // elige claro u oscuro segun ese color. El icono se va: era
                    // el mismo para todas y no distinguia nada.
                    const texto = textoLegible(account.color);
                    return (
                        <button
                            key={account.id}
                            type="button"
                            onClick={() => handleClick(account.id)}
                            style={{ backgroundColor: account.color }}
                            className={`flex w-full flex-col items-start justify-center gap-0.5 rounded-lg px-3 py-2 text-left transition-all hover:brightness-110 ${
                                isActive ? "ring-2 ring-white/80" : ""
                            } ${isDimmed ? "opacity-45" : ""}`}
                        >
                            <span
                                className={`w-full truncate text-sm leading-5 ${texto.secundario}`}
                            >
                                {account.name}
                            </span>
                            <span
                                className={`w-full truncate text-sm font-bold leading-5 ${texto.principal}`}
                            >
                                {account.currency_symbol}{" "}
                                {numeral(account.balance).format("0,0.00")}
                            </span>
                        </button>
                    );
                })}
                {data.length === 0 && (
                    <p className="text-sm text-gray-500">No accounts.</p>
                )}
            </div>
            {/* Adjusting a balance only makes sense for one account at a time:
                with none or several selected the numbers have no single owner. */}
            {activeIds.length === 1 && adjustBalance}
        </DashboardCard>
    );
}
