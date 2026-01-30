async function loadData() {
  const token = document.getElementById("token").value;
  const headers = { "x-admin-token": token };
  const agents = await fetch("/api/admin/agents", { headers }).then(r => r.json());
  const knowledge = await fetch("/api/admin/knowledge", { headers }).then(r => r.json());
  document.getElementById("agents").textContent = JSON.stringify(agents, null, 2);
  document.getElementById("knowledge").textContent = JSON.stringify(knowledge, null, 2);
}
