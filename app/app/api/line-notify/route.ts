export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    const LINE_API_URL = "https://api.line.me/v2/bot/message/broadcast"
    const ACCESS_TOKEN =
      "R8XNKe39GCH+o0kp5xgXRuAWhY7usM3Xw0lYt5FJRlQv1FZar4nQwwWUnGuV63hHQDFFnmmU7h7hoVNVrTjO4s9A9cOeicnVe4IntNpJk2SzrqszCzUIC83O9XcpH7VH9GnRBofCwK8A6FM6Ovb/pwdB04t89/1O/w1cDnyilFU="

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
      return Response.json({ success: false, message: "LINE送信失敗" }, { status: res.status })
    }

    return Response.json({ success: true, message: "LINE通知成功 ✅" }, { status: 200 })
  } catch (err) {
    return Response.json({ success: false, message: "LINE通知でサーバーエラー ❌" }, { status: 500 })
  }
}
