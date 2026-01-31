async function sendMessage() {
  const input = document.getElementById("input").value;
  const agent = document.getElementById("agent").value;
  const box = document.getElementById("chat-box");

  if (!input.trim()) {
    return;
  }

  box.innerHTML += `<div class="message user">🧑‍💻: ${input}</div>`;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId: agent, input })
  });

  const data = await res.json();

  box.innerHTML += `<div class="message agent">🤖: ${data.output}</div>`;
  box.scrollTop = box.scrollHeight;

  document.getElementById("input").value = "";
}
