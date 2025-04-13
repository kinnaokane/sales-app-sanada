"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface SalesProduct {
  id: number
  name: string
  price: number
  count: number
  subtotal: number
  workTime: number
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

interface SalesHistoryTableProps {
  data: SalesRecord[]
}

export default function SalesHistoryTable({ data }: SalesHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>日付</TableHead>
            <TableHead className="hidden sm:table-cell">記入者</TableHead>
            <TableHead className="hidden sm:table-cell">商品数</TableHead>
            <TableHead className="text-right">小計</TableHead>
            <TableHead className="hidden sm:table-cell text-right">消費税</TableHead>
            <TableHead className="text-right">合計</TableHead>
            <TableHead className="text-right w-10">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <>
              <TableRow
                key={record.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRow(record.id)}
              >
                <TableCell>
                  {expandedRows[record.id] ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell className="hidden sm:table-cell">{record.recorder}</TableCell>
                <TableCell className="hidden sm:table-cell">{record.products.length}種類</TableCell>
                <TableCell className="text-right">{record.subtotal.toLocaleString()}円</TableCell>
                <TableCell className="hidden sm:table-cell text-right">{record.tax.toLocaleString()}円</TableCell>
                <TableCell className="text-right font-medium">{record.total.toLocaleString()}円</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // 請求書生成処理
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              {expandedRows[record.id] && (
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={8} className="p-0">
                    <div className="p-4">
                      <h4 className="font-medium mb-2">商品詳細</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>商品名</TableHead>
                            <TableHead className="text-right">単価</TableHead>
                            <TableHead className="text-right">数量</TableHead>
                            <TableHead className="text-right">小計</TableHead>
                            <TableHead className="hidden sm:table-cell text-right">作業時間(分)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {record.products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="text-right">{product.price.toLocaleString()}円</TableCell>
                              <TableCell className="text-right">{product.count}</TableCell>
                              <TableCell className="text-right">{product.subtotal.toLocaleString()}円</TableCell>
                              <TableCell className="hidden sm:table-cell text-right">{product.workTime}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
