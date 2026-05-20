chrome.storage.sync.get(["UPSTASH_VECTOR_URL", "UPSTASH_VECTOR_TOKEN", "GROQ_API_KEY"], (result) => {
  if (result.UPSTASH_VECTOR_URL) document.getElementById("vectorUrl").value = result.UPSTASH_VECTOR_URL;
  if (result.UPSTASH_VECTOR_TOKEN) document.getElementById("vectorToken").value = result.UPSTASH_VECTOR_TOKEN;
  if (result.GROQ_API_KEY) document.getElementById("groqKey").value = result.GROQ_API_KEY;
});

document.getElementById("saveConfig").addEventListener("click", () => {
  const url = document.getElementById("vectorUrl").value.trim();
  const token = document.getElementById("vectorToken").value.trim();
  const groqKey = document.getElementById("groqKey").value.trim();
  const status = document.getElementById("status");

  if (!url || !token || !groqKey) {
    status.textContent = "Please fill in all fields";
    status.className = "status error";
    return;
  }

  chrome.storage.sync.set({
    UPSTASH_VECTOR_URL: url,
    UPSTASH_VECTOR_TOKEN: token,
    GROQ_API_KEY: groqKey
  }, () => {
    status.textContent = "Configuration saved successfully!";
    status.className = "status success";
    setTimeout(() => { status.className = "status"; }, 3000);
  });
});