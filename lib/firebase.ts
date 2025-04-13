import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyD-o0Ap4sLrupx_zsBPT4mCPlLcbgGmL5M",
  authDomain: "sanada-sale-app.firebaseapp.com",
  projectId: "sanada-sale-app",
  storageBucket: "sanada-sale-app.appspot.com",
  messagingSenderId: "178806304798",
  appId: "1:178806304798:web:8c912144e3204ed3567e0f",
  measurementId: "G-DYPC7HL5L9",
}

// ✅ すでに初期化されていた場合は reuse（VercelのSSR環境などで安全）
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const isFirestoreAvailable = true
