// プレビュー環境用の完全なモック実装

// Firestoreが利用可能かどうかのフラグ - プレビュー環境では常にfalse
export const isFirestoreAvailable = false

// モックデータを生成する関数
const createMockDoc = (data = {}) => ({
  id: `mock-${Date.now()}`,
  data: () => data,
  exists: true,
})

// Firestoreのモックオブジェクト
const mockFirestore = {
  collection: () => ({
    add: async (data: any) => createMockDoc(data),
    doc: (id: string) => ({
      get: async () => createMockDoc(),
      set: async (data: any) => {},
      update: async (data: any) => {},
      delete: async () => {},
    }),
  }),
  doc: (path: string) => ({
    get: async () => createMockDoc(),
    set: async (data: any) => {},
    update: async (data: any) => {},
    delete: async () => {},
  }),
}

// モックのFirestoreインスタンス
export const db = mockFirestore

// モックのコレクション関数
export const getCollection = (collectionName: string) => {
  console.log(`モックコレクション "${collectionName}" を使用します`)
  return {
    // モックのコレクションオブジェクト
    type: "collection",
    path: collectionName,
    // 他の必要なプロパティやメソッド
  }
}

// モックのクエリ関数
export const createQuery = (collectionRef: any, ...queryConstraints: any[]) => {
  console.log("モッククエリを使用します")
  return collectionRef
}

// モックのドキュメント追加関数
export const addDocument = async (collectionRef: any, data: any) => {
  console.log("モックaddDocを使用します", data)
  return { id: `mock-${Date.now()}` }
}

// モックのドキュメント取得関数
export const getDocuments = async (queryRef: any) => {
  console.log("モックgetDocsを使用します")
  return {
    docs: [],
    empty: true,
    size: 0,
    forEach: () => {},
  }
}

// モックのorderBy関数
export const orderByField = (field: string, direction: "asc" | "desc" = "asc") => {
  console.log(`モックorderBy: ${field} ${direction}`)
  return { type: "orderBy", field, direction }
}
