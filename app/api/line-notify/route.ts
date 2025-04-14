export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    console.log("📨 LINE ROUTE に入りました:", message)

    const LINE_API_URL = "https://api.line.me/v2/bot/message/broadcast"
    const ACCESS_TOKEN =
      "V9BGBNaS0rWv3MqH/R3PIXsFFESkAWTikpIwnjVWKsfgPwwyaZruJKNMmkFH2rJ9f4TYJCXOi1vQ8nii4lbjgo6pGp+HgycmJOLonF1VvOzkTIA/Td65vzjxdlmwDqyTUWwhQ9fquFwh+ivXl6U9UQdB04t89/1O/w1cDnyilFU="

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
      const text = await res.text()
      console.error("🛑 LINE APIからのエラー:", text)
      return Response.json({ success: false, message: "LINE送信失敗" }, { status: res.status })
    }

    return Response.json({ success: true, message: "LINE通知成功 ✅" }, { status: 200 })
  } catch (err) {
    console.error("🔥 routeエラー", err)
    return Response.json({ success: false, message: "LINE通知でサーバーエラー ❌" }, { status: 500 })
  }
}
