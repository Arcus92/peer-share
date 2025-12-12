import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import de from "./locales/de.json";

import LanguageDetector from "i18next-browser-languagedetector";

export default i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: "en",
    resources: {
      en,
      de,
    },

    interpolation: {
      escapeValue: false,
    },
  })
  .then();
