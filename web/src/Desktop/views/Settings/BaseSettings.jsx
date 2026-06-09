import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Api from "../../../Api/Endpoints";
import SettingsLayout from "../../layout/SettingsLayout";
import { Button } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export default function BaseSettings() {
    const { t, i18n } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState(i18n.language || 'en');

    useEffect(() => {
        async function loadSettings() {
            const settings = await Api.getUserSettings();
            if (settings?.language) {
                setLanguage(settings.language);
                i18n.changeLanguage(settings.language);
            }
        }
        loadSettings();
    }, []);

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        setLanguage(lang);
    };

    const handleSave = async () => {
        setIsLoading(true);
        await Api.updateUserSettings({ language });
        setIsLoading(false);
    };

    return (
        <SettingsLayout>
            <div className="flex flex-col gap-y-6 text-white">
                <div className="flex flex-row justify-between items-center">
                    <h3 className="text-2xl font-bold">{t('settings.title')}</h3>
                    <Button
                        color="success"
                        size="sm"
                        onClick={handleSave}
                        isLoading={isLoading}
                        startContent={!isLoading && <FontAwesomeIcon icon={faCheck} />}
                    >
                        {t('settings.save')}
                    </Button>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">
                        {t('settings.language')}
                    </label>
                    <div className="flex flex-row gap-x-3">
                        <button
                            type="button"
                            onClick={() => handleLanguageChange('en')}
                            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                                language === 'en'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                            }`}
                        >
                            🇬🇧 {t('settings.english')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLanguageChange('es')}
                            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                                language === 'es'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
                            }`}
                        >
                            🇪🇸 {t('settings.spanish')}
                        </button>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}
