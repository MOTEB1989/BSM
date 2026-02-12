import os
from typing import List, Tuple

import gradio as gr
import requests

API_BASE = os.getenv("API_BASE", "https://sr-bsm.onrender.com")
TIMEOUT_SECONDS = float(os.getenv("API_TIMEOUT_SECONDS", "30"))


def chat(message: str, history: List[Tuple[str, str]], agent_type: str):
    """Send message to LexBANK backend and append response to chat history."""
    cleaned_message = (message or "").strip()
    if not cleaned_message:
        return history, ""

    history = history or []

    try:
        response = requests.post(
            f"{API_BASE}/api/control/run",
            json={"agents": [agent_type], "query": cleaned_message},
            headers={
                "Content-Type": "application/json",
                "x-mode": "chat",
                "x-actor": "huggingface-user",
            },
            timeout=TIMEOUT_SECONDS,
        )

        if response.ok:
            data = response.json()
            bot_reply = data.get("result") or "تم استلام الرسالة"
        else:
            bot_reply = f"⚠️ خطأ: {response.status_code} - {response.text}"

    except requests.exceptions.Timeout:
        bot_reply = "⏱️ انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى."
    except requests.exceptions.ConnectionError:
        bot_reply = "🔌 لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل."
    except Exception as error:
        bot_reply = f"❌ خطأ غير متوقع: {str(error)}"

    history.append((cleaned_message, bot_reply))
    return history, ""


def check_connection():
    """Validate backend health endpoint connectivity."""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            return "✅ متصل"
        return f"⚠️ خطأ: {response.status_code}"
    except requests.exceptions.RequestException:
        return "❌ غير متصل"


with gr.Blocks(title="LexBANK Chat") as demo:
    gr.Markdown(
        """
    <div style="text-align: center;">
        <h1>🏦 LexBANK - المنصة المصرفية الذكية</h1>
        <p>محادثة آمنة مع وكلاء الذكاء الاصطناعي المتخصصين</p>
    </div>
    """
    )

    with gr.Row():
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(label="المحادثة", height=500, rtl=True, elem_classes=["rtl-text"])

            with gr.Row():
                msg = gr.Textbox(
                    label="رسالتك",
                    placeholder="اكتب استفسارك المصرفي هنا...",
                    scale=4,
                    rtl=True,
                )
                submit = gr.Button("📤 إرسال", scale=1, variant="primary")

        with gr.Column(scale=1):
            gr.Markdown("### ⚙️ الإعدادات")

            agent_type = gr.Dropdown(
                choices=[
                    ("🤖 Auto Router - توجيه تلقائي", "agent-auto"),
                    ("⚖️ Legal Expert - الخبير القانوني", "legal-agent"),
                    ("🏛️ Governance Agent - حوكمة", "governance-agent"),
                    ("🔒 Security Scanner - الأمان", "security-agent"),
                ],
                value="agent-auto",
                label="اختر الوكيل",
            )

            gr.Markdown("---")
            gr.Markdown("### 📊 الحالة")
            status = gr.Textbox(label="حالة الاتصال", value="غير معروف", interactive=False)

            check_btn = gr.Button("🔍 فحص الاتصال")

    submit.click(fn=chat, inputs=[msg, chatbot, agent_type], outputs=[chatbot, msg])
    msg.submit(fn=chat, inputs=[msg, chatbot, agent_type], outputs=[chatbot, msg])
    check_btn.click(fn=check_connection, outputs=status)


if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        theme=gr.themes.Soft(primary_hue="teal"),
        css="""
        .rtl-text { direction: rtl; text-align: right; }
        """,
    )
