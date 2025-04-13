"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChartBig, Settings, Save, Plus, AlertCircle, CheckCircle2, CloudOff, Download } from "lucide-react"
import ProductCard from "./product-card"
import SalesHistoryTable from "./sales-history-table"
import SalesChart from "./sales-chart"
import ProductTimeChart from "./product-time-chart"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getCollection,
  createQuery,
  addDocument,
  getDocuments,
  orderByField,
  isFirestoreAvailable,
} from "@/lib/firebase"
import dynamic from "next/dynamic"
const html2pdf = dynamic(() => import("html2pdf.js"), { ssr: false })
import InvoicePreview from "@/components/InvoicePreview"

// 型定義
interface Product {
  name: string
  count: number
  price: number
  subtotal: number
  reduced?: boolean
  taxRate: number
}

interface SalesProduct {
  id: number
  name: string
  price: number
  count: number
  subtotal: number
  workTime: number
  taxRate: number
}

interface SalesRecord {
  id: string
  date: string
  recorder: string
  products: SalesProduct[]
  subtotal: number
  tax: number
  total: number
  taxRate: number
}

// LINE通知を送信する関数
const sendLineMessage = async (message: string) => {
  try {
    const res = await fetch("/api/line-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText)
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.error("LINE通知送信エラー:", error)
    throw error
  }
}

// 商品データの初期値
const defaultProducts = [
  { id: 1, name: "中辛", price: 175, taxRate: 8 },
  { id: 2, name: "乳酸菌", price: 140, taxRate: 8 },
  { id: 3, name: "てしごと（ウス丸）", price: 215, taxRate: 8 },
  { id: 4, name: "日本", price: 155, taxRate: 8 },
  { id: 5, name: "匠", price: 355, taxRate: 8 },
  { id: 6, name: "てしごと本格", price: 415, taxRate: 8 },
  { id: 7, name: "手作り白菜200g", price: 315, taxRate: 8 },
  { id: 8, name: "本格", price: 405, taxRate: 8 },
  { id: 9, name: "一本漬け（日本）", price: 255, taxRate: 8 },
  { id: 10, name: "一本漬け（本格）", price: 255, taxRate: 8 },
  { id: 11, name: "一本漬け（手）", price: 355, taxRate: 8 },
  { id: 12, name: "ビニール（中辛）", price: 685, taxRate: 10 },
  { id: 13, name: "ビニール500g", price: 360, taxRate: 10 },
  { id: 14, name: "330g", price: 275, taxRate: 10 },
  { id: 15, name: "CGC", price: 275, taxRate: 10 },
  { id: 16, name: "日付", price: 131, taxRate: 8 },
  { id: 17, name: "あいかのキムチ", price: 195, taxRate: 8 },
]

// 記入者リストの初期値
const defaultRecorders = ["中元", "平林", "坂口", "木島", "一ノ瀬", "河西"]

// デモ用の売上履歴データ
const demoSalesHistory = [
  {
    id: "1",
    date: "2025-04-01",
    recorder: "中元",
    products: [
      { id: 1, name: "中辛", price: 175, count: 8, subtotal: 1400, workTime: 25, taxRate: 10 },
      { id: 2, name: "乳酸菌", price: 140, count: 12, subtotal: 1680, workTime: 35, taxRate: 8 },
      { id: 5, name: "匠", price: 355, count: 5, subtotal: 1775, workTime: 40, taxRate: 10 },
    ],
    subtotal: 4855,
    tax: 485,
    total: 5340,
    taxRate: 10,
  },
  {
    id: "2",
    date: "2025-04-02",
    recorder: "平林",
    products: [
      { id: 3, name: "てしごと（ウス丸）", price: 215, count: 10, subtotal: 2150, workTime: 50, taxRate: 10 },
      { id: 6, name: "てしごと本格", price: 415, count: 6, subtotal: 2490, workTime: 45, taxRate: 10 },
      { id: 9, name: "一本漬け（日本）", price: 255, count: 8, subtotal: 2040, workTime: 30, taxRate: 8 },
    ],
    subtotal: 6680,
    tax: 668,
    total: 7348,
    taxRate: 10,
  },
  {
    id: "3",
    date: "2025-04-03",
    recorder: "坂口",
    products: [
      { id: 4, name: "日本", price: 155, count: 15, subtotal: 2325, workTime: 30, taxRate: 8 },
      { id: 7, name: "手作り白菜200g", price: 315, count: 7, subtotal: 2205, workTime: 60, taxRate: 10 },
      { id: 8, name: "本格", price: 405, count: 5, subtotal: 2025, workTime: 45, taxRate: 10 },
    ],
    subtotal: 6555,
    tax: 655,
    total: 7210,
    taxRate: 10,
  },
  {
    id: "4",
    date: "2025-04-04",
    recorder: "木島",
    products: [
      { id: 10, name: "一本漬け（本格）", price: 255, count: 12, subtotal: 3060, workTime: 40, taxRate: 10 },
      { id: 11, name: "一本漬け（手）", price: 355, count: 8, subtotal: 2840, workTime: 55, taxRate: 10 },
      { id: 12, name: "ビニール（中辛）", price: 685, count: 4, subtotal: 2740, workTime: 35, taxRate: 10 },
    ],
    subtotal: 8640,
    tax: 864,
    total: 9504,
    taxRate: 10,
  },
  {
    id: "5",
    date: "2025-04-05",
    recorder: "一ノ瀬",
    products: [
      { id: 13, name: "ビニール500g", price: 360, count: 10, subtotal: 3600, workTime: 45, taxRate: 10 },
      { id: 14, name: "330g", price: 275, count: 15, subtotal: 4125, workTime: 50, taxRate: 10 },
      { id: 15, name: "CGC", price: 275, count: 12, subtotal: 3300, workTime: 40, taxRate: 10 },
    ],
    subtotal: 11025,
    tax: 1102,
    total: 12127,
    taxRate: 10,
  },
]

export default function SalesManagementApp() {
  // ステート
  const [date, setDate] = useState(() => {
    try {
      return new Date().toISOString().split("T")[0]
    } catch (e) {
      return (
        new Date().getFullYear() +
        "-" +
        String(new Date().getMonth() + 1).padStart(2, "0") +
        "-" +
        String(new Date().getDate()).padStart(2, "0")
      )
    }
  })

  const [invoiceMode, setInvoiceMode] = useState<"daily" | "monthly">("monthly")
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      return new Date().toISOString().split("T")[0]
    } catch (e) {
      return (
        new Date().getFullYear() +
        "-" +
        String(new Date().getMonth() + 1).padStart(2, "0") +
        "-" +
        String(new Date().getDate()).padStart(2, "0")
      )
    }
  })

  // 請求書プレビュー用のref
  const invoiceRef = useRef<HTMLDivElement>(null)
  const dailyInvoiceRef = useRef<HTMLDivElement>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [dailyPdfPreviewUrl, setDailyPdfPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const [products, setProducts] = useState(defaultProducts)
  const [productCounts, setProductCounts] = useState<Record<number, number | string>>({})
  const [productTimes, setProductTimes] = useState<Record<number, number | string>>({})
  const [taxRate, setTaxRate] = useState(10)
  const [salesHistory, setSalesHistory] = useState(demoSalesHistory)
  const [recorder, setRecorder] = useState("")
  const [recorderList, setRecorderList] = useState(defaultRecorders)
  const [isOnline, setIsOnline] = useState(false)
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null)
  const [lineNotify, setLineNotify] = useState(true)
  const [notificationEmail, setNotificationEmail] = useState("")
  const [companyInfo, setCompanyInfo] = useState({
    name: "株式会社キムチ工房",
    postalCode: "123-4567",
    addressLine: "東京都○○区××1-2-3",
    tel: "03-1234-5678",
    email: "info@kimchi-kobo.example.com",
    bankInfo: "○○銀行 △△支店 普通 1234567",
    clientName: "株式会社スーパーマーケット 御中",
    clientPostalCode: "890-1234",
    clientAddressLine: "東京都□□区△△4-5-6",
    registrationNumber: "T1234567890123",
  })

  // 月次請求書用の状態
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [monthlySalesData, setMonthlySalesData] = useState<SalesRecord[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])

  const { toast } = useToast()

  // Firestoreからデータを読み込む
  useEffect(() => {
    const fetchSalesHistory = async () => {
      try {
        // プレビュー環境ではデモデータを使用
        if (!isFirestoreAvailable) {
          console.warn("Firestoreが利用できません。デモデータを使用します。")
          setIsOnline(false)

          // デモデータをすでに使用しているので、追加の処理は不要
          toast({
            title: "デモモードで動作しています",
            description: "プレビュー環境ではFirestoreは利用できません",
            variant: "default",
          })
          return
        }

        // 以下は実際の環境でのみ実行される
        const salesCollection = getCollection("sales")
        const salesQuery = createQuery(salesCollection, orderByField("date", "asc"))
        const querySnapshot = await getDocuments(salesQuery)

        // データが存在するか確認
        if (!querySnapshot.empty) {
          const salesData = querySnapshot.docs.map((doc: any) => doc.data())
          setSalesHistory(salesData)
          setIsOnline(true)
          toast({
            title: "売上データを読み込みました ✅",
            description: `${salesData.length}件のデータを取得しました`,
            variant: "default",
          })
        } else {
          // データが空の場合もオンラインと判断
          setIsOnline(true)
          toast({
            title: "クラウド同期モードで動作しています",
            description: "まだデータがありません",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("売上履歴の取得に失敗しました:", error)
        setIsOnline(false)
        toast({
          title: "オフラインモードで動作します",
          description: "デモデータを使用します",
          variant: "default",
        })
      }
    }

    // 実行
    fetchSalesHistory()
  }, [toast])

  // localStorage から会社情報を読み込む
  useEffect(() => {
    const saved = localStorage.getItem("companyInfo")
    if (saved) {
      try {
        setCompanyInfo(JSON.parse(saved))
      } catch (error) {
        console.error("会社情報の読み込みに失敗しました:", error)
      }
    }
  }, [])

  // 利用可能な月のリストを生成
  useEffect(() => {
    const months = new Set<string>()
    salesHistory.forEach((record) => {
      const yearMonth = record.date.substring(0, 7) // YYYY-MM
      months.add(yearMonth)
    })
    setAvailableMonths(Array.from(months).sort())

    // 初期選択月を設定（データがある場合は最新の月を選択）
    if (months.size > 0) {
      const latestMonth = Array.from(months).sort().pop() || selectedMonth
      setSelectedMonth(latestMonth)
    }
  }, [salesHistory])

  // 選択された月のデータをフィルタリング
  useEffect(() => {
    const filteredData = salesHistory.filter((record) => record.date.startsWith(selectedMonth))
    setMonthlySalesData(filteredData)
  }, [selectedMonth, salesHistory])

  // ローディングインジケーターコンポーネント
  const LoadingIndicator = () => (
    <div className="flex items-center">
      <div className="animate-spin mr-2">⏳</div>
      <span>生成中...</span>
    </div>
  )

  // 月次請求書プレビュー生成
  const generateMonthlyInvoicePreview = async () => {
    if (monthlySalesData.length === 0) {
      toast({
        title: "選択された月のデータがありません",
        description: "別の月を選択するか、データを追加してください",
        variant: "destructive",
      })
      return
    }

    if (!invoiceRef.current) return

    try {
      setIsGeneratingPdf(true)
      setPdfPreviewUrl(null)

      // html2pdf.jsの正しい使用方法
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `invoice_${selectedMonth}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }

      // Promiseを使用して処理
      const pdfBlob = await new Promise<Blob>((resolve, reject) => {
        if (typeof window !== "undefined") {
          import("html2pdf.js")
            .then((module) => {
              const html2pdf = module.default
              html2pdf()
                .set(opt)
                .from(invoiceRef.current)
                .outputPdf("blob")
                .then((blob: Blob) => resolve(blob))
                .catch((error: any) => reject(error))
            })
            .catch((err) => reject(err))
        }
      })

      // BlobからURLを生成
      const previewUrl = URL.createObjectURL(pdfBlob)
      setPdfPreviewUrl(previewUrl)

      toast({
        title: "請求書プレビューを生成しました",
        description: "内容を確認してからダウンロードしてください",
        variant: "default",
      })
    } catch (error) {
      console.error("PDF生成エラー:", error)
      setPdfPreviewUrl(null)
      toast({
        title: "プレビュー生成に失敗しました",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // 月次請求書ダウンロード
  const downloadMonthlyInvoice = async () => {
    if (!invoiceRef.current) return

    try {
      const filename = `invoice_${selectedMonth}.pdf`
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }

      if (typeof window !== "undefined") {
        const html2pdf = (await import("html2pdf.js")).default
        html2pdf().set(opt).from(invoiceRef.current).save()
      }

      toast({
        title: "月次請求書PDFをダウンロードしました",
        description: `${filename} をダウンロードしました`,
        variant: "default",
      })
    } catch (error) {
      console.error("PDF生成エラー:", error)
      toast({
        title: "PDF生成に失敗しました",
        description: String(error),
        variant: "destructive",
      })
    }
  }

  // 日次請求書プレビュー生成
  const generateDailyInvoicePreview = async () => {
    const dailyProducts = products
      .filter((p) => productCounts[p.id] && Number(productCounts[p.id]) > 0)
      .map((p) => ({
        name: p.name,
        count: Number(productCounts[p.id]),
        price: p.price,
        subtotal: p.price * Number(productCounts[p.id]),
      }))

    if (dailyProducts.length === 0) {
      toast({
        title: "商品の数量を入力してください",
        variant: "destructive",
      })
      return
    }

    const subtotal = dailyProducts.reduce((sum, p) => sum + p.subtotal, 0)
    const tax = Math.floor(subtotal * (taxRate / 100))
    const total = subtotal + tax

    // 日次請求書用の一時的なdiv要素を作成
    const tempDiv = document.createElement("div")
    tempDiv.className = "bg-white p-8 text-black"
    tempDiv.style.width = "210mm"

    tempDiv.innerHTML = `
  <div class="flex justify-between items-start mb-8" style="font-family: 'Noto Sans JP', sans-serif;">
    <div class="w-1/2">
      <h1 class="text-4xl font-bold text-center mb-4">請 求 書</h1>
    </div>
    <div class="w-1/2 text-right">
      <p>日付 ${new Date().getFullYear()}年${String(new Date().getMonth() + 1).padStart(2, "0")}月${String(new Date().getDate()).padStart(2, "0")}日</p>
      <p>No. ${Date.now().toString().substring(5, 13)}</p>
    </div>
  </div>

  <div class="flex justify-between mb-12">
    <div class="w-1/2">
      <p class="font-bold text-lg mb-1">${companyInfo.clientName}</p>
      <p class="mb-1">${companyInfo.clientAddress}</p>
      <div class="mt-6">
        <p class="text-lg font-bold border-b-2 border-black pb-1 mb-2">
          ご請求金額
        </p>
        <p class="text-3xl font-bold">￥${total.toLocaleString()}-</p>
      </div>
      <div class="mt-6">
        <p>期日 ${new Date().getFullYear() + 1}年12月31日</p>
        <p>お振込先 ${companyInfo.bankInfo}</p>
        <p class="text-sm mt-1">※お振込の際の手数料は貴社にてご負担願います。</p>
      </div>
    </div>
    <div class="w-1/3 text-right">
      <p class="font-bold text-lg mb-1">${companyInfo.name}</p>
      <p class="mb-1">${companyInfo.address}</p>
      <p class="mb-1">電話 ${companyInfo.tel}</p>
      <p class="mb-1">登録番号: ${companyInfo.registrationNumber}</p>
    </div>
  </div>

  <div class="mb-8">
    <p class="text-lg font-bold border-b-2 border-black pb-1 mb-4">
      日付: ${date}
    </p>
    
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b-2 border-black">
          <th class="py-2 text-left">品名</th>
          <th class="py-2 text-right">数量</th>
          <th class="py-2 text-right">単価</th>
          <th class="py-2 text-right">金額</th>
        </tr>
      </thead>
      <tbody>
        ${dailyProducts
          .map((p) => {
            // 税率表示用（8%対象商品には※マークを付ける）
            const taxMark = p.name.includes("乳酸菌") || p.name.includes("日本") ? "※" : ""
            return `
            <tr class="border-b border-gray-300">
              <td class="py-2">${p.name}${taxMark}</td>
              <td class="py-2 text-right">${p.count}</td>
              <td class="py-2 text-right">${p.price.toLocaleString()}</td>
              <td class="py-2 text-right">${p.subtotal.toLocaleString()}</td>
            </tr>
          `
          })
          .join("")}
        ${
          dailyProducts.length < 8
            ? Array(8 - dailyProducts.length)
                .fill(0)
                .map(
                  (_, i) => `
          <tr class="border-b border-gray-300">
            <td class="py-2">&nbsp;</td>
            <td class="py-2">&nbsp;</td>
            <td class="py-2">&nbsp;</td>
            <td class="py-2">&nbsp;</td>
          </tr>
        `,
                )
                .join("")
            : ""
        }
      </tbody>
    </table>
    
    <div class="flex justify-between mt-4">
      <div class="w-1/2">
        <p class="text-sm">※軽減税率対象商品</p>
      </div>
      <div class="w-1/2">
        <table class="w-full">
          <tbody>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">標準税率対象（10%）</td>
              <td class="py-1 text-right">${dailyProducts
                .filter((p) => !(p.name.includes("乳酸菌") || p.name.includes("日本")))
                .reduce((sum, p) => sum + p.subtotal, 0)
                .toLocaleString()}円</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">消費税（10%）</td>
              <td class="py-1 text-right">${Math.floor(
                dailyProducts
                  .filter((p) => !(p.name.includes("乳酸菌") || p.name.includes("日本")))
                  .reduce((sum, p) => sum + p.subtotal, 0) * 0.1,
              ).toLocaleString()}円</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">軽減税率対象（8%）</td>
              <td class="py-1 text-right">${dailyProducts
                .filter((p) => p.name.includes("乳酸菌") || p.name.includes("日本"))
                .reduce((sum, p) => sum + p.subtotal, 0)
                .toLocaleString()}円</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">消費税（8%）</td>
              <td class="py-1 text-right">${Math.floor(
                dailyProducts
                  .filter((p) => p.name.includes("乳酸菌") || p.name.includes("日本"))
                  .reduce((sum, p) => sum + p.subtotal, 0) * 0.08,
              ).toLocaleString()}円</td>
            </tr>
            <tr class="border-b-2 border-black">
              <td class="py-1 font-bold">合計</td>
              <td class="py-1 text-right font-bold">${total.toLocaleString()}円</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="mt-8 text-sm">
    <p>上記の通りご請求申し上げます。</p>
    <p class="mt-4">※お支払期限: 請求書発行日より30日以内にお願いいたします。</p>
    <p>※ご不明な点がございましたら、上記連絡先までお問い合わせください。</p>
  </div>
`

    document.body.appendChild(tempDiv)

    try {
      setIsGeneratingPdf(true)
      setDailyPdfPreviewUrl(null)

      // html2pdf.jsの正しい使用方法
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `invoice_${date}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }

      // Promiseを使用して処理
      const pdfBlob = await new Promise<Blob>((resolve, reject) => {
        if (typeof window !== "undefined") {
          html2pdf()
            .set(opt)
            .from(tempDiv)
            .outputPdf("blob")
            .then((blob: Blob) => resolve(blob))
            .catch((error: any) => reject(error))
        }
      })

      // BlobからURLを生成
      const previewUrl = URL.createObjectURL(pdfBlob)
      setDailyPdfPreviewUrl(previewUrl)

      toast({
        title: "請求書プレビューを生成しました",
        description: "内容を確認してからダウンロードしてください",
        variant: "default",
      })
    } catch (error) {
      console.error("PDF生成エラー:", error)
      setDailyPdfPreviewUrl(null)
      toast({
        title: "プレビュー生成に失敗しました",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      document.body.removeChild(tempDiv)
      setIsGeneratingPdf(false)
    }
  }

  // 日次請求書ダウンロード
  const downloadDailyInvoice = async () => {
    const dailyProducts = products
      .filter((p) => productCounts[p.id] && Number(productCounts[p.id]) > 0)
      .map((p) => ({
        name: p.name,
        count: Number(productCounts[p.id]),
        price: p.price,
        subtotal: p.price * Number(productCounts[p.id]),
      }))

    if (dailyProducts.length === 0) {
      toast({
        title: "商品の数量を入力してください",
        variant: "destructive",
      })
      return
    }

    // 日次請求書用の一時的なdiv要素を作成
    const tempDiv = document.createElement("div")
    tempDiv.className = "bg-white p-8 text-black"
    tempDiv.style.width = "210mm"

    // HTMLコンテンツは変更なし
    tempDiv.innerHTML = `
  <div class="flex justify-between items-start mb-8" style="font-family: 'Noto Sans JP', sans-serif;">
    <div class="w-1/2">
      <h1 class="text-4xl font-bold text-center mb-4">請 求 書</h1>
    </div>
    <div class="w-1/2 text-right">
      <p>日付 ${new Date().getFullYear()}年${String(new Date().getMonth() + 1).padStart(2, "0")}月${String(new Date().getDate()).padStart(2, "0")}日</p>
      <p>No. ${Date.now().toString().substring(5, 13)}</p>
    </div>
  </div>

  <div class="flex justify-between mb-12">
    <div class="w-1/2">
      <p class="font-bold text-lg mb-1">${companyInfo.clientName}</p>
      <p class="mb-1">${companyInfo.clientAddress}</p>
      <div class="mt-6">
        <p class="text-lg font-bold border-b-2 border-black pb-1 mb-2">
          ご請求金額
        </p>
        <p class="text-3xl font-bold">￥${total.toLocaleString()}-</p>
      </div>
      <div class="mt-6">
        <p>期日 ${new Date().getFullYear() + 1}年12月31日</p>
        <p>お振込先 ${companyInfo.bankInfo}</p>
        <p class="text-sm mt-1">※お振込の際の手数料は貴社にてご負担願います。</p>
      </div>
    </div>
    <div class="w-1/3 text-right">
      <p class="font-bold text-lg mb-1">${companyInfo.name}</p>
      <p class="mb-1">${companyInfo.address}</p>
      <p class="mb-1">電話 ${companyInfo.tel}</p>
      <p class="mb-1">登録番号: ${companyInfo.registrationNumber}</p>
    </div>
  </div>

  <div class="mb-8">
    <p class="text-lg font-bold border-b-2 border-black pb-1 mb-4">
      日付: ${date}
    </p>
    
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b-2 border-black">
          <th class="py-2 text-left">品名</th>
          <th class="py-2 text-right">数量</th>
          <th class="py-2 text-right">単価</th>
          <th class="py-2 text-right">金額</th>
        </tr>
      </thead>
      <tbody>
        ${dailyProducts
          .map((p) => {
            // 税率表示用（8%対象商品には※マークを付ける）
            const taxMark = p.name.includes("乳酸菌") || p.name.includes("日本") ? "※" : ""
            return `
            <tr class="border-b border-gray-300">
              <td class="py-2">${p.name}${taxMark}</td>
              <td class="py-2 text-right">${p.count}</td>
              <td class="py-2 text-right">${p.price.toLocaleString()}</td>
              <td class="py-2 text-right">${p.subtotal.toLocaleString()}</td>
            </tr>
          `
          })
          .join("")}
        ${
          dailyProducts.length < 8
            ? Array(8 - dailyProducts.length)
                .fill(0)
                .map(
                  (_, i) => `
          <tr class="border-b border-gray-300">
            <td class="py-2">&nbsp;</td>
            <td class="py-2">&nbsp;</td>
            <td class="py-2">&nbsp;</td>
            <td class="py-2">&nbsp;</td>
          </tr>
        `,
                )
                .join("")
            : ""
        }
      </tbody>
    </table>
    
    <div class="flex justify-between mt-4">
      <div class="w-1/2">
        <p class="text-sm">※軽減税率対象商品</p>
      </div>
      <div class="w-1/2">
        <table class="w-full">
          <tbody>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">標準税率対象（10%）</td>
              <td class="py-1 text-right">${dailyProducts
                .filter((p) => !(p.name.includes("乳酸菌") || p.name.includes("日本")))
                .reduce((sum, p) => sum + p.subtotal, 0)
                .toLocaleString()}円</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">消費税（10%）</td>
              <td class="py-1 text-right">${Math.floor(
                dailyProducts
                  .filter((p) => !(p.name.includes("乳酸菌") || p.name.includes("日本")))
                  .reduce((sum, p) => sum + p.subtotal, 0) * 0.1,
              ).toLocaleString()}円</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">軽減税率対象（8%）</td>
              <td class="py-1 text-right">${dailyProducts
                .filter((p) => p.name.includes("乳酸菌") || p.name.includes("日本"))
                .reduce((sum, p) => sum + p.subtotal, 0)
                .toLocaleString()}円</td>
            </tr>
            <tr class="border-b border-gray-300">
              <td class="py-1 font-bold">消費税（8%）</td>
              <td class="py-1 text-right">${Math.floor(
                dailyProducts
                  .filter((p) => p.name.includes("乳酸菌") || p.name.includes("日本"))
                  .reduce((sum, p) => sum + p.subtotal, 0) * 0.08,
              ).toLocaleString()}円</td>
            </tr>
            <tr class="border-b-2 border-black">
              <td class="py-1 font-bold">合計</td>
              <td class="py-1 text-right font-bold">${total.toLocaleString()}円</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="mt-8 text-sm">
    <p>上記の通りご請求申し上げます。</p>
    <p class="mt-4">※お支払期限: 請求書発行日より30日以内にお願いいたします。</p>
    <p>※ご不明な点がございましたら、上記連絡先までお問い合わせください。</p>
  </div>
`

    document.body.appendChild(tempDiv)

    try {
      const filename = `invoice_${date}.pdf`
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }

      if (typeof window !== "undefined") {
        const html2pdf = (await import("html2pdf.js")).default
        html2pdf().set(opt).from(tempDiv).save()
      }

      toast({
        title: "請求書PDFをダウンロードしました",
        description: `${filename} をダウンロードしました`,
        variant: "default",
      })
    } catch (error) {
      console.error("PDF生成エラー:", error)
      toast({
        title: "PDF生成に失敗しました",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      document.body.removeChild(tempDiv)
    }
  }

  // 会社情報を保存する関数
  const saveCompanyInfo = () => {
    localStorage.setItem("companyInfo", JSON.stringify(companyInfo))
    toast({
      title: "会社情報を保存しました ✅",
      variant: "default",
    })
  }

  // 商品の状態をコンポーネント内で定義
  const [newProduct, setNewProduct] = useState({ name: "", price: "" })
  const [editingProduct, setEditingProduct] = useState<{ id: number; name: string; price: number } | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  // 数量変更ハンドラー
  const handleCountChange = (productId: number, count: string) => {
    const validCount = count === "" ? "" : Number(count)
    setProductCounts({
      ...productCounts,
      [productId]: validCount,
    })
  }

  // 作業時間変更ハンドラー
  const handleTimeChange = (productId: number, time: string) => {
    const validTime = time === "" ? "" : Number(time)
    setProductTimes({
      ...productTimes,
      [productId]: validTime,
    })
  }

  // 日付変更ハンドラー
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
  }

  // 保存ハンドラー
  const handleSave = async () => {
    // 記入者名が選択されていない場合は警告
    if (!recorder) {
      toast({
        title: "記入者名を選択してください",
        variant: "destructive",
      })
      return
    }

    // 販売データ計算
    const dailyProducts = products
      .filter((product) => productCounts[product.id] && Number(productCounts[product.id]) > 0)
      .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        count: Number(productCounts[product.id]),
        subtotal: product.price * Number(productCounts[product.id]),
        workTime: productTimes[product.id] ? Number(productTimes[product.id]) : 0,
        taxRate: product.taxRate,
      }))

    if (dailyProducts.length === 0) {
      toast({
        title: "商品の数量を入力してください",
        variant: "destructive",
      })
      return
    }

    // 現在設定されている税率を使用
    const currentTaxRate = taxRate || 10
    const subtotal = dailyProducts.reduce((sum, product) => sum + product.subtotal, 0)

    // 消費税を計算（小数点以下切り捨て）
    const tax = Math.floor(subtotal * (currentTaxRate / 100))
    const total = subtotal + tax

    // 新しい販売記録
    const newSalesRecord = {
      id: Date.now().toString(),
      date,
      recorder: recorder,
      products: dailyProducts,
      subtotal,
      tax,
      total,
      taxRate: currentTaxRate,
      timestamp: new Date().toISOString(),
    }

    // 履歴に追加（ローカル）
    const updatedHistory = [...salesHistory, newSalesRecord]
    updatedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setSalesHistory(updatedHistory)

    // Firestoreにデータを保存（利用可能な場合のみ）
    try {
      if (isFirestoreAvailable) {
        // 実際の環境でのみ実行
        const salesCollection = getCollection("sales")
        await addDocument(salesCollection, newSalesRecord)
        toast({
          title: "Firestoreに保存されました ✅",
          variant: "default",
        })
      } else {
        // プレビュー環境ではローカルのみに保存
        toast({
          title: "デモモードで保存しました",
          description: "プレビュー環境ではFirestoreは利用できません",
          variant: "default",
        })
      }

      // LINE通知を送信
      const message =
        `【本日の売上（税抜）】¥${subtotal.toLocaleString()}\n` +
        `作成者：${recorder}\n` +
        "作った商品：\n" +
        dailyProducts.map((p) => `・${p.name} x ${p.count}個`).join("\n")

      if (lineNotify) {
        try {
          await sendLineMessage(message)
          toast({ title: "LINE通知を送信しました ✅" })
        } catch (error) {
          toast({
            title: "LINE通知に失敗しました ❌",
            description: String(error),
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "データ保存に失敗しました ❌",
        description: String(error),
        variant: "destructive",
      })
    }

    // 通知
    toast({
      title: "売上データを保存しました",
      description: `${date} の売上: ${total.toLocaleString()}円`,
      variant: "default",
    })

    // 入力フィールドをリセット
    setProductCounts({})
    setProductTimes({})
  }

  // 月別集計データの取得
  const getMonthlyData = () => {
    const monthlyData: Record<string, any> = {}

    salesHistory.forEach((record) => {
      const yearMonth = record.date.substring(0, 7) // YYYY-MM
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          month: yearMonth,
          sales: 0,
          productSales: {},
        }
      }

      monthlyData[yearMonth].sales += record.total

      // 商品別集計
      record.products.forEach((product) => {
        if (!monthlyData[yearMonth].productSales[product.name]) {
          monthlyData[yearMonth].productSales[product.name] = 0
        }
        monthlyData[yearMonth].productSales[product.name] += product.subtotal
      })
    })

    return Object.values(monthlyData)
  }

  // 商品別作業時間データの取得
  const getProductTimeData = () => {
    const productTimeData: Record<string, any> = {}

    salesHistory.forEach((record) => {
      record.products.forEach((product) => {
        if (product.workTime) {
          if (!productTimeData[product.name]) {
            productTimeData[product.name] = {
              name: product.name,
              totalTime: 0,
              productionCount: 0,
            }
          }

          productTimeData[product.name].totalTime += Number(product.workTime)
          productTimeData[product.name].productionCount += product.count
        }
      })
    })

    return Object.values(productTimeData).map((item) => ({
      ...item,
      averageTime: item.totalTime / item.productionCount,
    }))
  }

  // 全体のサブタイトル
  const calculateTotals = () => {
    let totalSales = 0
    let totalProducts = 0

    salesHistory.forEach((record) => {
      totalSales += record.total
      record.products.forEach((product) => {
        totalProducts += product.count
      })
    })

    return { totalSales, totalProducts }
  }

  // 商品追加ハンドラー
  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast({
        title: "商品名と価格を入力してください",
        variant: "destructive",
      })
      return
    }

    const newId = Math.max(...products.map((p) => p.id), 0) + 1
    const productToAdd = {
      id: newId,
      name: newProduct.name,
      price: Number(newProduct.price),
    }

    setProducts([...products, productToAdd])
    setNewProduct({ name: "", price: "" })
    toast({
      title: "商品を追加しました",
      description: `${productToAdd.name} (${productToAdd.price}円)`,
    })
  }

  // 商品編集ハンドラー
  const handleEditProduct = () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.price) {
      toast({
        title: "商品名と価格を入力してください",
        variant: "destructive",
      })
      return
    }

    setProducts(
      products.map((p) =>
        p.id === editingProduct.id ? { ...p, name: editingProduct.name, price: editingProduct.price } : p,
      ),
    )

    setEditingProduct(null)
    toast({
      title: "商品情報を更新しました",
    })
  }

  // 商品削除ハンドラー
  const handleDeleteProduct = (id: number) => {
    // 確認
    if (!window.confirm("この商品を削除してもよろしいですか？")) {
      return
    }

    setProducts(products.filter((p) => p.id !== id))
    toast({
      title: "商品を削除しました",
    })
  }

  const { totalSales, totalProducts } = calculateTotals()

  // 月次データの集計
  const monthlySubtotal = monthlySalesData.reduce((sum, record) => sum + record.subtotal, 0)
  const monthlyTax = Math.floor(monthlySubtotal * (taxRate / 100))
  const monthlyTotal = monthlySubtotal + monthlyTax

  // 月次商品集計
  const monthlyProducts = Object.values(
    monthlySalesData
      .flatMap((record) => record.products)
      .reduce(
        (acc, p) => {
          if (!acc[p.name]) {
            acc[p.name] = { name: p.name, count: 0, price: p.price, subtotal: 0 }
          }
          acc[p.name].count += p.count
          acc[p.name].subtotal += p.subtotal
          return acc
        },
        {} as Record<string, Product>,
      ),
  ).sort((a, b) => b.subtotal - a.subtotal) // 金額の大きい順にソート

  // BlobURLのクリーンアップ
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
      if (dailyPdfPreviewUrl) {
        URL.revokeObjectURL(dailyPdfPreviewUrl)
      }
    }
  }, [pdfPreviewUrl, dailyPdfPreviewUrl])

  const handleInvoiceDownload = async () => {
    if (!invoiceRef.current) return

    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `invoice-${date}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }

      if (typeof window !== "undefined") {
        const html2pdf = (await import("html2pdf.js")).default
        html2pdf().set(opt).from(invoiceRef.current).save()
      }
    } catch (error) {
      console.error("PDF生成エラー:", error)
      toast({
        title: "PDF生成に失敗しました",
        description: String(error),
        variant: "destructive",
      })
    }
  }

  // 印刷用のスタイルを追加
  useEffect(() => {
    // 印刷用のスタイルを追加
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #invoiceRef, #invoiceRef * {
          visibility: visible;
        }
        #invoiceRef {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // メール送信機能を追加
  const sendEmailNotification = () => {
    if (!notificationEmail) {
      toast({
        title: "メールアドレスが設定されていません",
        description: "設定タブでメールアドレスを登録してください",
        variant: "destructive",
      })
      return
    }

    // 実際のメール送信の代わりにトースト通知
    toast({
      title: "請求書通知メールを送信しました",
      description: `送信先: ${notificationEmail}`,
      variant: "default",
    })
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:py-6 sm:px-4 max-w-7xl">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">売上管理アプリ</h1>
            <p className="text-gray-500 mt-1">
              {isOnline ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> クラウド同期モード
                </span>
              ) : (
                <span className="flex items-center text-amber-600">
                  <CloudOff className="h-4 w-4 mr-1" /> ローカルモード（オフライン）
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {notification && (
        <Alert
          className={`mb-6 ${notification.type === "error" ? "bg-red-50 text-red-800 border-red-200" : "bg-green-50 text-green-800 border-green-200"}`}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="input" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-8">
          <TabsTrigger value="input" className="flex items-center text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> 日次入力
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center text-xs sm:text-sm">
            <BarChartBig className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> 集計・レポート
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> 設定
          </TabsTrigger>
        </TabsList>

        {/* 日次入力タブ */}
        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>日付と記入者を入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">日付</Label>
                  <Input id="date" type="date" value={date} onChange={handleDateChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recorder">記入者</Label>
                  <Select value={recorder} onValueChange={setRecorder}>
                    <SelectTrigger>
                      <SelectValue placeholder="記入者を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {recorderList.map((name, index) => (
                        <SelectItem key={index} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>商品数量入力</CardTitle>
              <CardDescription>各商品の数量と作業時間を入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    count={productCounts[product.id] || ""}
                    workTime={productTimes[product.id] || ""}
                    onCountChange={(value) => handleCountChange(product.id, value)}
                    onTimeChange={(value) => handleTimeChange(product.id, value)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSave} className="px-8">
              <Save className="h-4 w-4 mr-2" /> 保存
            </Button>
          </div>
        </TabsContent>

        {/* 集計・レポートタブ */}
        <TabsContent value="report" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-500">総売上合計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{totalSales.toLocaleString()}円</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-500">総生産数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{totalProducts}個</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-500">データ件数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{salesHistory.length}件</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle>月次売上レポート</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <SalesChart data={getMonthlyData()} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>商品別作業時間分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ProductTimeChart data={getProductTimeData()} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>売上履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesHistoryTable data={salesHistory} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 設定タブ */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>アプリ設定</CardTitle>
              <CardDescription>アプリケーションの基本設定を行います</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">通知メールアドレス</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="例: keiri@example.com, shacho@example.com"
                />
                <p className="text-sm text-gray-500">複数のアドレスはカンマで区切ってください</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lineNotify"
                  checked={lineNotify}
                  onChange={(e) => setLineNotify(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="lineNotify">LINE通知を有効にする</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>会社情報</CardTitle>
              <CardDescription>請求書に表示される会社情報を設定します</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">会社名</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPostalCode">郵便番号</Label>
                    <div className="flex items-center">
                      <span className="mr-1">〒</span>
                      <Input
                        id="companyPostalCode"
                        value={companyInfo.postalCode}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
                        placeholder="123-4567"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddressLine">住所</Label>
                    <Input
                      id="companyAddressLine"
                      value={companyInfo.addressLine}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, addressLine: e.target.value })}
                      placeholder="東京都○○区××1-2-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyTel">電話番号</Label>
                    <Input
                      id="companyTel"
                      value={companyInfo.tel}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, tel: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">メールアドレス</Label>
                    <Input
                      id="companyEmail"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyBankInfo">銀行口座情報</Label>
                    <Input
                      id="companyBankInfo"
                      value={companyInfo.bankInfo}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, bankInfo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRegistrationNumber">インボイス登録番号</Label>
                    <Input
                      id="companyRegistrationNumber"
                      value={companyInfo.registrationNumber}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">請求先名</Label>
                    <Input
                      id="clientName"
                      value={companyInfo.clientName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, clientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPostalCode">請求先郵便番号</Label>
                    <div className="flex items-center">
                      <span className="mr-1">〒</span>
                      <Input
                        id="clientPostalCode"
                        value={companyInfo.clientPostalCode}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, clientPostalCode: e.target.value })}
                        placeholder="890-1234"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientAddressLine">請求先住所</Label>
                    <Input
                      id="clientAddressLine"
                      value={companyInfo.clientAddressLine}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, clientAddressLine: e.target.value })}
                      placeholder="東京都□□区△△4-5-6"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={saveCompanyInfo}>
                  <Save className="h-4 w-4 mr-2" /> 会社情報を保存
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 請求書出力セクション */}
          <Card>
            <CardHeader>
              <CardTitle>📄 請求書出力</CardTitle>
              <CardDescription>月次・日次の請求書を発行します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 請求書出力モード選択 */}
              <div className="space-y-2">
                <Label>請求書出力モード</Label>
                <div className="flex gap-4">
                  <Button
                    variant={invoiceMode === "daily" ? "default" : "outline"}
                    onClick={() => setInvoiceMode("daily")}
                  >
                    日次
                  </Button>
                  <Button
                    variant={invoiceMode === "monthly" ? "default" : "outline"}
                    onClick={() => setInvoiceMode("monthly")}
                  >
                    月次
                  </Button>
                </div>

                {invoiceMode === "daily" ? (
                  <div className="mt-4">
                    <Label htmlFor="selectedDate">対象日</Label>
                    <Input
                      id="selectedDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full sm:w-48 mt-1"
                    />
                  </div>
                ) : (
                  <div className="mt-4">
                    <Label htmlFor="selectedMonth">対象月</Label>
                    <Input
                      id="selectedMonth"
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full sm:w-48 mt-1"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <Label htmlFor="invoiceTaxRate">請求書税率</Label>
                  <Select value={taxRate.toString()} onValueChange={(value) => setTaxRate(Number(value))}>
                    <SelectTrigger id="invoiceTaxRate" className="w-full sm:w-48 mt-1">
                      <SelectValue placeholder="税率を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">軽減税率 8%</SelectItem>
                      <SelectItem value="10">標準税率 10%</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">※請求書出力時の税率を選択してください</p>
                </div>
              </div>

              {/* データ集計と表示 */}
              {(() => {
                const filteredSales = salesHistory.filter((record) =>
                  invoiceMode === "monthly" ? record.date.startsWith(selectedMonth) : record.date === selectedDate,
                )

                if (filteredSales.length === 0) {
                  return (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {invoiceMode === "monthly"
                          ? "選択された月のデータがありません"
                          : "選択された日付のデータがありません"}
                      </AlertDescription>
                    </Alert>
                  )
                }

                const subtotal = filteredSales.reduce((sum, record) => sum + record.subtotal, 0)
                const tax = filteredSales.reduce((sum, record) => sum + record.tax, 0)
                const total = filteredSales.reduce((sum, record) => sum + record.total, 0)

                const groupedProducts = Object.values(
                  filteredSales
                    .flatMap((record) => record.products)
                    .reduce(
                      (acc, p) => {
                        if (!acc[p.name]) {
                          acc[p.name] = {
                            name: p.name,
                            count: 0,
                            price: p.price,
                            subtotal: 0,
                            taxRate: p.taxRate || (p.name.includes("乳酸菌") || p.name.includes("日本") ? 8 : 10),
                          }
                        }
                        acc[p.name].count += p.count
                        acc[p.name].subtotal += p.subtotal
                        return acc
                      },
                      {} as Record<string, Product>,
                    ),
                ).sort((a, b) => b.subtotal - a.subtotal)

                const tax10Total = groupedProducts
                  .filter((p) => p.taxRate === 10)
                  .reduce((sum, p) => sum + p.subtotal, 0)

                const tax8Total = groupedProducts.filter((p) => p.taxRate === 8).reduce((sum, p) => sum + p.subtotal, 0)

                const tax10 = Math.floor(tax10Total * 0.1)
                const tax8 = Math.floor(tax8Total * 0.08)

                const calculatedTotal = tax10Total + tax10 + tax8Total + tax8

                return (
                  <>
                    <Card className="bg-gray-50 mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {invoiceMode === "monthly" ? "月次集計" : "日次集計"}プレビュー
                        </CardTitle>
                        <CardDescription>
                          {invoiceMode === "monthly"
                            ? `${selectedMonth}の売上データ (${filteredSales.length}件)`
                            : `${selectedDate}の売上データ (${filteredSales.length}件)`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">小計（税抜）</p>
                              <p className="text-xl font-bold">{subtotal.toLocaleString()}円</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">消費税</p>
                              <p className="text-xl font-bold">{tax.toLocaleString()}円</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">合計（税込）</p>
                              <p className="text-xl font-bold">{total.toLocaleString()}円</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">商品内訳</h4>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>商品名</TableHead>
                                    <TableHead className="text-right">数量</TableHead>
                                    <TableHead className="text-right">単価</TableHead>
                                    <TableHead className="text-right">小計</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {groupedProducts.map((product) => (
                                    <TableRow key={product.name}>
                                      <TableCell>
                                        {product.name}
                                        {product.reduced ? "※" : ""}
                                      </TableCell>
                                      <TableCell className="text-right">{product.count}</TableCell>
                                      <TableCell className="text-right">{product.price.toLocaleString()}円</TableCell>
                                      <TableCell className="text-right">
                                        {product.subtotal.toLocaleString()}円
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 請求書プレビュー */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-3">請求書プレビュー</h3>
                      <div id="invoiceRef">
                        <InvoicePreview
                          ref={invoiceRef}
                          date={invoiceMode === "daily" ? selectedDate : `${selectedMonth}-末日`}
                          invoiceNumber={`INV-${invoiceMode === "daily" ? selectedDate.replace(/-/g, "") : selectedMonth.replace(/-/, "")}`}
                          clientName={companyInfo.clientName}
                          clientAddress={`〒${companyInfo.clientPostalCode} ${companyInfo.clientAddressLine}`}
                          companyInfo={{
                            name: companyInfo.name,
                            address: `〒${companyInfo.postalCode} ${companyInfo.addressLine}`,
                            tel: companyInfo.tel,
                            registrationNumber: companyInfo.registrationNumber,
                            bank: companyInfo.bankInfo,
                            dueDate:
                              invoiceMode === "daily"
                                ? new Date(new Date(selectedDate).getTime() + 30 * 24 * 60 * 60 * 1000)
                                    .toISOString()
                                    .split("T")[0]
                                : `${selectedMonth}-末日`,
                          }}
                          products={groupedProducts}
                          tax10Total={tax10Total}
                          tax8Total={tax8Total}
                          total={calculatedTotal}
                        />
                      </div>
                    </div>

                    {/* PDF出力ボタン */}
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          if (!invoiceRef.current) {
                            toast({
                              title: "エラー",
                              description: "請求書プレビューが見つかりません",
                              variant: "destructive",
                            })
                            return
                          }

                          try {
                            const opt = {
                              margin: [10, 10, 10, 10],
                              filename: `invoice_${invoiceMode === "daily" ? selectedDate : selectedMonth}.pdf`,
                              image: { type: "jpeg", quality: 0.98 },
                              html2canvas: { scale: 2, useCORS: true },
                              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                            }

                            // html2pdf.jsを使用してPDFを生成
                            if (typeof window !== "undefined") {
                              const html2pdf = (await import("html2pdf.js")).default
                              html2pdf().set(opt).from(invoiceRef.current).save()
                            }

                            toast({
                              title: "請求書PDFをダウンロードしました",
                              description: `${invoiceMode === "daily" ? selectedDate : selectedMonth}の請求書をダウンロードしました`,
                              variant: "default",
                            })
                          } catch (error) {
                            console.error("PDF生成エラー:", error)
                            toast({
                              title: "PDF生成に失敗しました",
                              description: String(error),
                              variant: "destructive",
                            })
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ダウンロード
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!invoiceRef.current) {
                            toast({
                              title: "エラー",
                              description: "請求書プレビューが見つかりません",
                              variant: "destructive",
                            })
                            return
                          }
                          window.print()
                        }}
                      >
                        <span className="mr-2">🖨</span>
                        印刷する
                      </Button>
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                      <h4 className="font-medium mb-2">📧 請求書通知</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        請求書をPDFでダウンロードした後、設定タブで登録したメールアドレスに通知を送信できます。
                        取引先への請求書送付時に便利にご利用いただけます。
                      </p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="emailNotify"
                          checked={notificationEmail !== ""}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          disabled={false}
                          onChange={() => {
                            if (notificationEmail === "") {
                              toast({
                                title: "メールアドレスが設定されていません",
                                description: "設定タブでメールアドレスを登録してください",
                                variant: "destructive",
                              })
                            }
                          }}
                        />
                        <Label htmlFor="emailNotify" className={notificationEmail === "" ? "text-gray-400" : ""}>
                          請求書通知をメールで送信する
                        </Label>
                        {notificationEmail === "" && (
                          <p className="text-xs text-amber-600">
                            ※メール通知を利用するには設定タブでメールアドレスを登録してください
                          </p>
                        )}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!notificationEmail) {
                              toast({
                                title: "メールアドレスが設定されていません",
                                description: "設定タブでメールアドレスを登録してください",
                                variant: "destructive",
                              })
                              return
                            }

                            // 実際のメール送信の代わりにトースト通知
                            toast({
                              title: "請求書通知メールを送信しました",
                              description: `送信先: ${notificationEmail}`,
                              variant: "default",
                            })
                          }}
                          className="text-sm"
                        >
                          📧 メール送信テスト
                        </Button>
                      </div>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>

          {/* 商品管理セクション */}
          <Card>
            <CardHeader>
              <CardTitle>📦 商品管理</CardTitle>
              <CardDescription>商品の追加、編集、削除を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-medium mb-2">商品リスト</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品名</TableHead>
                        <TableHead className="text-right">価格</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {editingProduct?.id === product.id ? (
                              <Input
                                type="text"
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                              />
                            ) : (
                              product.name
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingProduct?.id === product.id ? (
                              <Input
                                type="number"
                                value={editingProduct.price}
                                onChange={(e) =>
                                  setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                                }
                              />
                            ) : (
                              `${product.price.toLocaleString()}円`
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingProduct?.id === product.id ? (
                              <div className="flex justify-center space-x-2">
                                <Button size="sm" onClick={handleEditProduct}>
                                  保存
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                                  キャンセル
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setEditingProduct({ id: product.id, name: product.name, price: product.price })
                                  }
                                >
                                  編集
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                                  \ 削除
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">商品の追加</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newProductName">商品名</Label>
                    <Input
                      type="text"
                      id="newProductName"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newProductPrice">価格</Label>
                    <Input
                      type="number"
                      id="newProductPrice"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    />
                  </div>
                </div>
                <Button className="mt-4" onClick={handleAddProduct}>
                  商品を追加
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
