"use client"

import React, { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

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
  const chartInstanceRef = useRef<Chart | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !chartRef.current || data.length === 0) return
    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // 既存チャートがあれば破棄
    chartInstanceRef.current?.destroy()

    // データ整形：平均時間の大きい順トップ10
    const sorted = [...data].sort((a, b) => b.averageTime - a.averageTime).slice(0, 10)
    const labels = sorted.map((d) => d.name)
    const avgTimes = sorted.map((d) => d.averageTime)
    const totTimes = sorted.map((d) => d.totalTime)

    // 新しいチャート生成
    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "平均作業時間(分/個)",
            data: avgTimes,
            backgroundColor: "rgba(99, 102, 241, 0.5)",
            borderColor: "rgb(99, 102, 241)",
            borderWidth: 1,
            yAxisID: "y",
          },
          {
            label: "総作業時間(分)",
            data: totTimes,
            type: "line",
            backgroundColor: "rgba(244, 114, 182, 0.5)",
            borderColor: "rgb(244, 114, 182)",
            borderWidth: 1,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "商品名" } },
          x: { beginAtZero: true, title: { display: true, text: "平均作業時間(分/個)" } },
          y1: {
            beginAtZero: true,
            position: "right",
            grid: { drawOnChartArea: false },
            title: { display: true, text: "総作業時間(分)" },
          },
        },
      },
    })

    return () => {
      chartInstanceRef.current?.destroy()
      chartInstanceRef.current = null
    }
  }, [data, isClient])

  return <canvas ref={chartRef} />
}
