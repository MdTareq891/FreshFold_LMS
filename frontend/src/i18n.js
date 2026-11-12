import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import bn from "./locales/bn.json";

const savedLang = localStorage.getItem("lms_lang") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setAppLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem("lms_lang", lang);
}

export default i18n;
