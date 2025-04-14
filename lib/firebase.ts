// lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  type QueryConstraint,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore"

// Firebaseの設定（変更不要）
const firebaseConfig = {
  apiKey: "AIzaSyD-o0Ap4sLrupx_zsBPT4mCPlLcbgGmL5M",
  authDomain: "sanada-sale-app.firebaseapp.com",
  projectId: "sanada-sale-app",
  storageBucket: "sanada-sale-app.appspot.com",
  messagingSenderId: "178806304798",
  appId: "1:178806304798:web:8c912144e3204ed3567e0f",
  measurementId: "G-DYPC7HL5L9"
}

// Firebase初期化（複数回防止）
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Firestoreインスタンスを取得
export const db = getFirestore(app)

// クラウド同期フラグ
export const isFirestoreAvailable = true

// Firestoreのコレクション取得
export const getCollection = (collectionName: string) => {
  return collection(db, collectionName)
}

// クエリの作成
export const createQuery = (collectionRef: any, ...queryConstraints: QueryConstraint[]) => {
  return query(collectionRef, ...queryConstraints)
}

// ドキュメント追加
export const addDocument = async (collectionRef: any, data: any) => {
  return await addDoc(collectionRef, data)
}

// ドキュメント取得
export const getDocuments = async (queryRef: any): Promise<QuerySnapshot<DocumentData>> => {
  return await getDocs(queryRef)
}

// ソート用
export const orderByField = (field: string, direction: "asc" | "desc" = "asc") => {
  return orderBy(field, direction)
}
