import streamlit as st

from bsm_config.src.api.client_factory import APIClientFactory


def getEnabledProviders():
    import os
    return [
        name for name, key in {
            "openai": os.getenv("OPENAI_API_KEY"),
            "anthropic": os.getenv("ANTHROPIC_API_KEY"),
            "gemini": os.getenv("GOOGLE_API_KEY"),
            "azure": os.getenv("AZURE_OPENAI_API_KEY"),
            "groq": os.getenv("GROQ_API_KEY"),
            "cohere": os.getenv("COHERE_API_KEY"),
            "mistral": os.getenv("MISTRAL_API_KEY"),
            "perplexity": os.getenv("PERPLEXITY_API_KEY"),
        }.items() if key
    ]


st.title("🧠 BSM-AgentOS — AI-Powered Agent Dashboard")

enabled = getEnabledProviders()
st.subheader("📡 Active AI Providers:")
st.write(", ".join(enabled) if enabled else "No providers configured")

if st.button("🧪 Test AI Report Generation"):
    factory = APIClientFactory.fromProviders(enabled)
    client = factory.getPrimaryClient()

    result = client.generateReport({
        "title": "Test Report",
        "data": {"sample": "data"},
        "format": "markdown"
    })

    st.success("✅ Report Generated!")
    st.markdown(result["content"])
