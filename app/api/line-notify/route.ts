export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    console.log("📨 LINE ROUTE に入りました:", message)

    const LINE_API_URL = "https://api.line.me/v2/bot/message/broadcast"
    
    // 🔽 トークンをここに直接貼り付ける（セキュリティには要注意）
    const ACCESS_TOKEN = "ここにあなたのトークンを貼り付ける"

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
      return Response.json({ success: false, message: "LINE送信失敗" }, { status: res.status })
    }

    return Response.json({ success: true, message: "LINE通知成功 ✅" }, { status: 200 })
  } catch (err) {
    console.error("🔥 LINE通知サーバーエラー:", err)
    return Response.json({ success: false, message: "LINE通知でサーバーエラー ❌" }, { status: 500 })
  }
}
