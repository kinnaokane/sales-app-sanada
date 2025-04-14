"use client"

import { useEffect, useRef, useState } from "react"
import "chart.js/auto" // ✅ これだけでOK！

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

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !chartRef.current || !data.length) return

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.destroy()
      } catch (e) {
        console.warn("チャートの破棄に失敗しました", e)
      }
      chartInstanceRef.current = null
    }

    const sortedData = [...data].sort((a, b) => b.averageTime - a.averageTime)
    const topProducts = sortedData.slice(0, 10)

    const productNames = topProducts.map((item) => item.name)
    const averageTimes = topProducts.map((item) => item.averageTime)
    const totalTimes = topProducts.map((item) => item.totalTime)

    try {
      chartInstanceRef.current = new Chart(ctx, {
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
              title: { display: true, text: "商品名" },
            },
            x: {
              beginAtZero: true,
              title: { display: true, text: "平均作業時間(分/個)" },
            },
            y1: {
              beginAtZero: true,
              position: "right",
              grid: { drawOnChartArea: false },
              title: { display: true, text: "総作業時間(分)" },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number
                  return context.dataset.label === "平均作業時間(分/個)"
                    ? `平均: ${value.toFixed(1)}分/個`
                    : `総時間: ${value}分`
                },
              },
            },
          },
        },
      })
    } catch (err) {
      console.error("チャートの作成に失敗しました", err)
    }

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
