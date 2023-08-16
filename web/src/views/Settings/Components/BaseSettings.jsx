import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
} from "@nextui-org/react";
import Api from "../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyCard from "./CurrencyCard";

export default function BaseSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [userSettings, setUserSettings] = useState([]);
    const [userCurrencies, setUserCurrencies] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    async function getData() {
        try {
            const userSettings = await Api.getUserSettings();
            const userCurrencies = await Api.getUserCurrencies();
            const currencies = await Api.getAllCurrencies();
            setUserSettings(userSettings);
            setCurrencies(currencies);
            setUserCurrencies(userCurrencies);
            setIsLoading(false);
        } catch (error) {
            // console.error("Error updating user settings:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getData();
    }, []);

    const handleInputChange = (event) => {
        const field = event.target.name;
        const value = event.target.value;
        const data = { [field]: value };
        setUserSettings((prevData) => ({ ...prevData, ...data }));
    };

    const handleSaveSettings = async () => {
        try {
            setIsLoading(true);
            await Api.updateUserSettings(userSettings);
        } catch (error) {
            // console.error("Error updating user settings:", error);
        } finally {
            getData();
        }
    };

    const handleCreateNewCurrency = async (e) => {
        try {
            setIsLoading(true);
            e.preventDefault();
            const formData = new FormData(document.querySelector("form"));
            const formObject = Object.fromEntries(formData.entries());
            await Api.createUserCurrency(formObject);
        } catch (error) {
            // console.error("Error updating user settings:", error);
        } finally {
            getData();
            onOpenChange();
        }
    };

    const NewCurrencyModal = (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            className="mt-10"
            placement="center"
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            New currency
                        </ModalHeader>
                        <form onSubmit={handleCreateNewCurrency}>
                            <ModalBody>
                                <select
                                    name="currency_id"
                                    id="currency_id"
                                    required={true}
                                    className="relative w-full inline-flex shadow-sm px-3 border-medium border-default-200 data-[hover=true]:border-default-400 group-data-[focus=true]:border-foreground min-h-unit-10 rounded-medium flex-col items-start justify-center gap-0 transition-background !duration-150 transition-colors motion-reduce:transition-none h-14 py-2"
                                >
                                    {currencies.map((currency, index) => {
                                        return (
                                            <option
                                                key={index}
                                                value={currency.id}
                                            >
                                                {currency.name}{" "}
                                                {currency.symbol} (
                                                {currency.code})
                                            </option>
                                        );
                                    })}
                                </select>
                                <Input
                                    label="Rate"
                                    name="exchange_rate_to_default_currency"
                                    type="number"
                                    step="any"
                                    required={true}
                                    variant="bordered"
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    isLoading={isLoading}
                                >
                                    Save
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );

    return (
        <div className="mt-20 px-5 m-auto relative text-white">
            {NewCurrencyModal}
            <h3 className="text-3xl font-bold mb-4">Main settings</h3>
            <div>
                <div className="flex flex-col gap-y-10">
                    <div className="w-full top-0 basis-1/12 flex flex-row justify-between items-center h-14">
                        <Button
                            color="success"
                            onClick={handleSaveSettings}
                            isLoading={isLoading}
                            className="w-full"
                            startContent={
                                !isLoading && (
                                    <FontAwesomeIcon icon="fa-solid fa-check" />
                                )
                            }
                        >
                            Success
                        </Button>
                    </div>
                    <div className="w-full flex flex-col gap-y-10">
                        <div className="w-full">
                            <label
                                htmlFor="name"
                                className="block mb-2 text-sm font-medium text-gray-900 text-white"
                            >
                                Base currency
                            </label>
                            <select
                                name="currency_id"
                                id="currency_id"
                                required={true}
                                onChange={handleInputChange}
                                className="block w-full p-4 border border-gray-700 rounded-lg bg-background sm:text-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                {userCurrencies.map((currency, index) => {
                                    return (
                                        <option
                                            key={index}
                                            value={currency.id}
                                            selected={
                                                currency.id ===
                                                userSettings?.currency.id
                                            }
                                        >
                                            {currency.name} {currency.symbol} (
                                            {currency.code})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="flex flex-col gap-y-3 mt-10">
                            <div>
                                <Button
                                    color="primary"
                                    onPress={onOpen}
                                    startContent={
                                        <FontAwesomeIcon icon="fa-solid fa-plus" />
                                    }
                                >
                                    Add new currency
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {userCurrencies
                                    .filter(
                                        (currency) =>
                                            currency.id !==
                                            userSettings.currency.id
                                    )
                                    .map((currency) => (
                                        <CurrencyCard
                                            key={currency.id}
                                            currency={currency}
                                            userSettings={userSettings}
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
