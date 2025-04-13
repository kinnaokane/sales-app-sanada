"use client"

// フォントのインポートを試みるが、エラーが発生した場合は無視する
let font: string | null = null
try {
  // 動的インポートを避け、直接代入する
  font = null // プレビュー環境では使用しない
} catch (error) {
  console.warn("フォントのインポートに失敗しました:", error)
  font = null
}

type Product = {
  name: string
  count: number
  price: number
  subtotal: number
}

type InvoiceOptions = {
  date: string
  recorder: string
  products: Product[]
  companyName: string
  taxRate: number // 8 or 10
}

// jsPDFを動的にインポート
const importJsPDF = async () => {
  if (typeof window !== "undefined") {
    try {
      const module = await import("jspdf")
      return module.default
    } catch (error) {
      console.error("jsPDFのインポートに失敗しました:", error)
      return null
    }
  }
  return null
}

export async function generateInvoicePDF({ date, recorder, products, companyName, taxRate }: InvoiceOptions) {
  // サーバーサイドでの実行を防ぐ
  if (typeof window === "undefined") {
    console.warn("サーバーサイドでPDF生成は実行できません")
    return false
  }

  // jsPDFを動的にインポート
  const jsPDF = await importJsPDF()
  if (!jsPDF) {
    console.error("jsPDFのインポートに失敗しました")
    return false
  }

  try {
    const doc = new jsPDF()

    // 以下は変更なし

    // プレビュー環境では簡易的なPDFを生成
    console.log("PDF生成を開始します")
    console.log("日付:", date)
    console.log("記入者:", recorder)
    console.log("商品数:", products.length)

    let y = 20
    const subtotal = products.reduce((sum, p) => sum + p.subtotal, 0)
    const tax = Math.floor(subtotal * (taxRate / 100))
    const total = subtotal + tax

    // PDFのタイトル
    doc.setFontSize(16)
    doc.text("Invoice", 105, y, { align: "center" })
    y += 10

    // 基本情報
    doc.setFontSize(12)
    doc.text(`Company: ${companyName}`, 20, y)
    y += 10
    doc.text(`Date: ${date}`, 20, y)
    y += 10
    doc.text(`Recorder: ${recorder}`, 20, y)
    y += 10

    // 商品明細
    doc.text("Products:", 20, y)
    y += 8

    products.forEach((p) => {
      // 英語表記に変更して文字化けを回避
      doc.text(`- ${p.name} x ${p.count} @${p.price} = ${p.subtotal.toLocaleString()}`, 25, y)
      y += 8
    })

    // 合計金額
    y += 10
    doc.text(`Subtotal: ${subtotal.toLocaleString()}`, 20, y)
    y += 8
    doc.text(`Tax (${taxRate}%): ${tax.toLocaleString()}`, 20, y)
    y += 8
    doc.text(`Total: ${total.toLocaleString()}`, 20, y)

    // PDFを保存
    try {
      doc.save(`invoice_${date}.pdf`)
      console.log("PDF生成が完了しました")
      return true
    } catch (error) {
      console.error("PDF保存中にエラーが発生しました:", error)
      alert("PDF生成中にエラーが発生しました。コンソールを確認してください。")
      return false
    }
  } catch (error) {
    console.error("PDF生成中にエラーが発生しました:", error)
    return false
  }
}
