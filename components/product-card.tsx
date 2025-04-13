"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProductCardProps {
  product: {
    id: number
    name: string
    price: number
  }
  count: string | number
  workTime: string | number
  onCountChange: (value: string) => void
  onTimeChange: (value: string) => void
}

export default function ProductCard({ product, count, workTime, onCountChange, onTimeChange }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-medium">{product.name}</div>
          <div className="text-sm text-gray-500">{product.price.toLocaleString()}円</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`count-${product.id}`} className="text-xs">
              数量
            </Label>
            <Input
              id={`count-${product.id}`}
              type="number"
              min="0"
              value={count}
              onChange={(e) => onCountChange(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`time-${product.id}`} className="text-xs">
              作業時間(分)
            </Label>
            <Input
              id={`time-${product.id}`}
              type="number"
              min="0"
              value={workTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        {count && (
          <div className="mt-2 text-right text-sm font-medium">
            小計: {(product.price * Number(count)).toLocaleString()}円
          </div>
        )}
      </CardContent>
    </Card>
  )
}
