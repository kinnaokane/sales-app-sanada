"use client"

import React, { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

interface MonthlyData {
  month: string
  sales: number
  productSales: Record<string, number>
}

interface SalesChartProps {
  data: MonthlyData[]
}

export default function SalesChart({ data }: SalesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // 既存チャートの破棄
    chartRef.current?.destroy()

    // ラベルとデータを整形
    const labels = data.map((item) => {
      const [year, month] = item.month.split("-")
      return `${year}年${month}月`
    })
    const salesData = data.map((item) => item.sales)

    // 新しいチャート生成
    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
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
              // Y軸の目盛りを「xx円」表記に
              callback: (value) => `${value.toLocaleString()}円`,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw as number
                return `売上: ${v.toLocaleString()}円`
              },
            },
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data])

  return <canvas ref={canvasRef} />
}
