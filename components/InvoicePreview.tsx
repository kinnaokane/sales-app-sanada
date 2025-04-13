"use client"
import React from "react"

type Product = {
  name: string
  count: number
  price: number
  subtotal: number
  taxRate: number
}

type Props = {
  date: string
  invoiceNumber: string
  clientName: string
  clientAddress: string
  companyInfo: {
    name: string
    address: string
    tel: string
    registrationNumber: string
    bank: string
    dueDate: string
  }
  products: Product[]
  tax10Total: number
  tax8Total: number
  total: number
}

const InvoicePreview = React.forwardRef<HTMLDivElement, Props>(
  ({ date, invoiceNumber, clientName, clientAddress, companyInfo, products, tax10Total, tax8Total, total }, ref) => {
    const tax10 = Math.floor(tax10Total * 0.1)
    const tax8 = Math.floor(tax8Total * 0.08)
    const calculatedTotal = tax10Total + tax10 + tax8Total + tax8

    return (
      <div ref={ref} className="bg-white p-8 text-black text-sm max-w-3xl mx-auto border border-gray-300 rounded">
        <h1 className="text-xl font-bold text-center mb-6">請 求 書</h1>
        <div className="mb-4">
          <p className="text-right">日付：{date}</p>
          <p className="text-right">請求書番号：{invoiceNumber}</p>
        </div>
        <div className="mb-6">
          <p>{clientName}</p>
          <p>{clientAddress}</p>
        </div>

        <div className="mb-4">
          <p>下記の通りご請求申し上げます。</p>
          <p className="text-2xl font-bold mt-2">ご請求金額 ¥{calculatedTotal.toLocaleString()}</p>
        </div>

        <table className="w-full border border-collapse mb-6 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">内容</th>
              <th className="border px-2 py-1">数量</th>
              <th className="border px-2 py-1">単価</th>
              <th className="border px-2 py-1">金額</th>
              <th className="border px-2 py-1">税率</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{p.name}</td>
                <td className="border text-center">{p.count}</td>
                <td className="border text-right">¥{p.price.toLocaleString()}</td>
                <td className="border text-right">¥{p.subtotal.toLocaleString()}</td>
                <td className="border text-center">{p.taxRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mb-2">
          <p>10%対象：¥{tax10Total.toLocaleString()}</p>
          <p>消費税：¥{tax10.toLocaleString()}</p>
          <p>8%対象：¥{tax8Total.toLocaleString()}</p>
          <p>消費税：¥{tax8.toLocaleString()}</p>
          <p className="font-bold">合計：¥{calculatedTotal.toLocaleString()}</p>
        </div>

        <div className="text-sm mt-6">
          <p>
            <strong>{companyInfo.name}</strong>
          </p>
          <p>{companyInfo.address}</p>
          <p>TEL：{companyInfo.tel}</p>
          <p>登録番号：{companyInfo.registrationNumber}</p>
          <p className="mt-2">
            <strong>振込先：</strong> {companyInfo.bank}
          </p>
          <p>振込期日：{companyInfo.dueDate}</p>
          <p className="text-xs mt-1">※振込手数料は貴社負担でお願いいたします。</p>
        </div>
      </div>
    )
  },
)

InvoicePreview.displayName = "InvoicePreview"

export default InvoicePreview
