export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    console.log("📨 LINE ROUTE に入りました:", message)

    const LINE_API_URL = "https://api.line.me/v2/bot/message/broadcast"
    const ACCESS_TOKEN = process.env.LINE_NOTIFY_TOKEN // ✅ 環境変数から取得！

    if (!ACCESS_TOKEN) {
      console.error("❌ LINE_NOTIFY_TOKEN が設定されていません")
      return Response.json({ success: false, message: "アクセストークン未設定" }, { status: 500 })
    }

    const res = await fetch(LINE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("🛑 LINE APIエラー:", errorText)
      return Response.json({ success: false, message: "LINE送信失敗" }, { status: res.status })
    }

    console.log("✅ LINE通知成功")
    return Response.json({ success: true, message: "LINE通知成功 ✅" }, { status: 200 })
  } catch (err) {
    console.error("🔥 routeエラー", err)
    return Response.json({ success: false, message: "LINE通知でサーバーエラー ❌" }, { status: 500 })
  }
}
