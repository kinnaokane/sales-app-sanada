"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

// Chart.jsをクライアントサイドのみでインポート
const ChartJS = dynamic(() => import("chart.js/auto"), { ssr: false })

interface ProductTimeData {
  name: string
  totalTime: number
  productionCount: number
  averageTime: number
}

interface ProductTimeChartProps {
  data: ProductTimeData[]
}

export default function ProductTimeChart({ data }: ProductTimeChartProps) {
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

    // Sort data by average time
    const sortedData = [...data].sort((a, b) => b.averageTime - a.averageTime)

    // Limit to top 10 products for readability
    const topProducts = sortedData.slice(0, 10)

    const productNames = topProducts.map((item) => item.name)
    const averageTimes = topProducts.map((item) => item.averageTime)
    const totalTimes = topProducts.map((item) => item.totalTime)

    // 非同期でChart.jsをロード
    import("chart.js/auto")
      .then((ChartModule) => {
        try {
          // 新しいチャートを作成
          chartInstanceRef.current = new ChartModule.Chart(ctx, {
            type: "bar",
            data: {
              labels: productNames,
              datasets: [
                {
                  label: "平均作業時間(分/個)",
                  data: averageTimes,
                  backgroundColor: "rgba(99, 102, 241, 0.5)",
                  borderColor: "rgb(99, 102, 241)",
                  borderWidth: 1,
                  yAxisID: "y",
                },
                {
                  label: "総作業時間(分)",
                  data: totalTimes,
                  backgroundColor: "rgba(244, 114, 182, 0.5)",
                  borderColor: "rgb(244, 114, 182)",
                  borderWidth: 1,
                  type: "line",
                  yAxisID: "y1",
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "商品名",
                  },
                },
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "平均作業時間(分/個)",
                  },
                },
                y1: {
                  beginAtZero: true,
                  position: "right",
                  grid: {
                    drawOnChartArea: false,
                  },
                  title: {
                    display: true,
                    text: "総作業時間(分)",
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw as number
                      if (context.dataset.label === "平均作業時間(分/個)") {
                        return `平均: ${value.toFixed(1)}分/個`
                      } else {
                        return `総時間: ${value}分`
                      }
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
