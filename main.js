const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const transcriptDiv = document.getElementById("transcript");
const summaryDiv = document.getElementById("summary");
const statusDiv = document.getElementById("status");

let recognition;
let finalTranscript = "";

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "id-ID";

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + "\n";
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    transcriptDiv.textContent = finalTranscript + interimTranscript;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event);
    statusDiv.innerHTML = `<span class="text-danger">Error dalam perekaman suara: ${event.error}</span>`;
  };

  recognition.onend = () => {
    finalTranscript = transcriptDiv.textContent.trim();
    statusDiv.innerHTML = `<span class="text-muted">Perekaman berhenti.</span>`;
  };
} else {
  alert("Browser Anda tidak mendukung Speech Recognition.");
}

startBtn.addEventListener("click", () => {
  if (recognition) {
    finalTranscript = "";
    transcriptDiv.textContent = "";
    summaryDiv.innerHTML = "(Belum ada ringkasan)";
    recognition.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    summarizeBtn.disabled = true;
    statusDiv.innerHTML = `<span class="blinking">Merekam...</span>`;
  }
});

stopBtn.addEventListener("click", () => {
  if (recognition) {
    recognition.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    summarizeBtn.disabled = false;
  }
});

summarizeBtn.addEventListener("click", async () => {
  const textToSummarize = finalTranscript.trim();
  if (!textToSummarize) {
    alert("Tidak ada teks untuk dirangkum.");
    return;
  }

  summaryDiv.innerHTML = "Sedang membuat ringkasan...";

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer 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",
          Referer: "https://apriansyah-dimas.github.io/Summary/",
          "X-Title": "Summary From Audio",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: [
            {
              role: "system",
              content:
                "Anda adalah asisten yang membantu meringkas transkrip meeting menjadi poin-poin penting.",
            },
            {
              role: "user",
              content: `Ringkaskan teks berikut menjadi poin-poin penting:\n\n${textToSummarize}`,
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log(data);
    const markdownText =
      data.choices?.[0]?.message?.content || "Tidak ada ringkasan.";
    summaryDiv.innerHTML = marked.parse(markdownText);
  } catch (error) {
    summaryDiv.innerHTML = "Error: " + error.message;
  }
});
