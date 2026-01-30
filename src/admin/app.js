async function loadData() {
  try {
    const token = document.getElementById("token").value;
    if (!token) {
      alert("Please enter an admin token");
      return;
    }
    
    const headers = { "x-admin-token": token };
    
    const agentsRes = await fetch("/api/admin/agents", { headers });
    if (!agentsRes.ok) {
      throw new Error(`Agents request failed: ${agentsRes.status} ${agentsRes.statusText}`);
    }
    const agents = await agentsRes.json();
    
    const knowledgeRes = await fetch("/api/admin/knowledge", { headers });
    if (!knowledgeRes.ok) {
      throw new Error(`Knowledge request failed: ${knowledgeRes.status} ${knowledgeRes.statusText}`);
    }
    const knowledge = await knowledgeRes.json();
    
    document.getElementById("agents").textContent = JSON.stringify(agents, null, 2);
    document.getElementById("knowledge").textContent = JSON.stringify(knowledge, null, 2);
  } catch (error) {
    alert("Error loading data: " + error.message);
    console.error("Failed to load data:", error);
  }
}
