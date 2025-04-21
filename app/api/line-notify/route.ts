// app/api/line‑notify/route.ts

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    console.log("📨 LINE ROUTE に入りました:", message)

    const LINE_API_URL = "https://api.line.me/v2/bot/message/broadcast"
    const ACCESS_TOKEN =
      "Fz0pp4PghNqa+9HpHySRVT7ss1LEtB3FSnFIWoim1qnP6iN113ndZTIT2hunbVivQDFFnmmU7h7hoVNVrTjO4s9A9cOeicnVe4IntNpJk2SWY2B27NzsxSEwVijRIy0SOiXdY3FlIyurutcDYBMEgQdB04t89/1O/w1cDnyilFU="

    const res = await fetch(LINE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [{ type: "text", text: message }],
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("🛑 LINE APIエラー:", errorText)
      return Response.json(
        { success: false, message: "LINE送信失敗" },
        { status: res.status }
      )
    }

    return Response.json(
      { success: true, message: "LINE通知成功 ✅" },
      { status: 200 }
    )
  } catch (err) {
    console.error("🔥 LINE通知サーバーエラー:", err)
    return Response.json(
      { success: false, message: "LINE通知でサーバーエラー ❌" },
      { status: 500 }
    )
  }
}
