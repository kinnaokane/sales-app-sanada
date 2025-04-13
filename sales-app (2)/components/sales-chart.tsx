"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

// Chart.jsをクライアントサイドのみでインポート
const ChartJS = dynamic(() => import("chart.js/auto"), { ssr: false })

interface MonthlyData {
  month: string
  sales: number
  productSales: Record<string, number>
}

interface SalesChartProps {
  data: MonthlyData[]
}

export default function SalesChart({ data }: SalesChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行されるようにする
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !chartRef.current || !data.length) return

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // 以前のチャートを破棄（安全に行う）
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.destroy()
      } catch (e) {
        console.warn("チャートの破棄に失敗しました", e)
      }
      chartInstanceRef.current = null
    }

    // Format data for chart
    const months = data.map((item) => {
      const [year, month] = item.month.split("-")
      return `${year}年${month}月`
    })

    const salesData = data.map((item) => item.sales)

    // 非同期でChart.jsをロード
    import("chart.js/auto")
      .then((ChartModule) => {
        try {
          // 新しいチャートを作成
          chartInstanceRef.current = new ChartModule.Chart(ctx, {
            type: "bar",
            data: {
              labels: months,
              datasets: [
                {
                  label: "月間売上",
                  data: salesData,
                  backgroundColor: "rgba(59, 130, 246, 0.5)",
                  borderColor: "rgb(59, 130, 246)",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => value.toLocaleString() + "円",
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw as number
                      return `売上: ${value.toLocaleString()}円`
                    },
                  },
                },
              },
            },
          })
        } catch (err) {
          console.error("チャートの作成に失敗しました", err)
        }
      })
      .catch((err) => {
        console.error("Chart.jsのロードに失敗しました", err)
      })

    // クリーンアップ関数
    return () => {
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy()
        } catch (e) {
          console.warn("クリーンアップ時のチャート破棄に失敗しました", e)
        }
        chartInstanceRef.current = null
      }
    }
  }, [data, isClient])

  return <canvas ref={chartRef} />
}
