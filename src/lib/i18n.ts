
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      common: {
        back: "Back",
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        search: "Search",
        loading: "Loading...",
      },
      ride: {
        pickup: "Pickup Location",
        dropoff: "Dropoff Location",
        request_ride: "Request Ride",
        finding_driver: "Finding your driver...",
        driver_found: "Driver found! On the way.",
        calculating_fare: "Calculating fare...",
      },
      auth: {
        sign_in: "Sign In",
        sign_up: "Sign Up",
        sign_out: "Sign Out",
      }
    }
  },
  id: {
    translation: {
      common: {
        back: "Kembali",
        cancel: "Batal",
        confirm: "Konfirmasi",
        save: "Simpan",
        search: "Cari",
        loading: "Memuat...",
      },
      ride: {
        pickup: "Lokasi Jemput",
        dropoff: "Lokasi Tujuan",
        request_ride: "Pesan Sekarang",
        finding_driver: "Mencari driver...",
        driver_found: "Driver ditemukan! Menuju lokasi.",
        calculating_fare: "Menghitung tarif...",
      },
      auth: {
        sign_in: "Masuk",
        sign_up: "Daftar",
        sign_out: "Keluar",
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
