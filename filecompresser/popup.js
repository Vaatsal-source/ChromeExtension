document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // 🔁 SESSION STORAGE
  // =========================
  let lastCompressed = {
    originalHash: "",
    originalSize: 0,
    originalSampleRate: 0,
    originalDuration: 0,
    type: "",
    originalImageDataUrl: "",
    compressedBitrate: 128,
  };

  const output = document.getElementById("output");
  const fileInput = document.getElementById("fileInput");
  const fileNameLabel = document.getElementById("fileName");
  const dropZone = document.getElementById("dropZone");
  const modeSelect = document.getElementById("modeSelect");

  // ✅ NEW UI ELEMENTS
  const progressBar = document.getElementById("progressBar");
  const loader = document.getElementById("loader");

  // =========================
  // 📂 FILE UI HANDLING
  // =========================
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];

      const sizeKB = (file.size / 1024).toFixed(1);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

      const sizeDisplay = file.size < 1024 * 1024
        ? `${sizeKB} KB`
        : `${sizeMB} MB`;

      fileNameLabel.textContent = `📄 ${file.name} (${sizeDisplay})`;
      dropZone.classList.add("active");
    } else {
      fileNameLabel.textContent = "No file selected";
      dropZone.classList.remove("active");
    }
  });

  // =========================
  // 🧰 HELPERS
  // =========================
  function setOutput(text, state = "") {
    output.innerText = text;
    output.className = state;
  }

  function showLoader(show) {
    loader.style.display = show ? "block" : "none";
  }

  function updateProgress(value) {
    progressBar.style.width = value + "%";
  }

  function resetProgress() {
    progressBar.style.width = "0%";
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function compressionSummary(label, original, compressed) {
    const ratio = (original / compressed).toFixed(2);
    const savings = (((original - compressed) / original) * 100).toFixed(2);

    return `[${label}]
Original: ${formatBytes(original)}
Compressed: ${formatBytes(compressed)}
Ratio: ${ratio}:1
Saved: ${savings}%`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function getSHA256(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // =========================
  // 📊 IMAGE QUALITY (PSNR)
  // =========================
  async function calculatePSNR(originalDataUrl, compressedBlob) {
    return new Promise((resolve) => {
      const compressedUrl = URL.createObjectURL(compressedBlob);

      const img1 = new Image();
      const img2 = new Image();

      const canvas1 = document.createElement("canvas");
      const canvas2 = document.createElement("canvas");

      img1.onload = () => {
        img2.onload = () => {

          const w = Math.min(img1.width, img2.width);
          const h = Math.min(img1.height, img2.height);

          canvas1.width = canvas2.width = w;
          canvas1.height = canvas2.height = h;

          canvas1.getContext("2d").drawImage(img1, 0, 0, w, h);
          canvas2.getContext("2d").drawImage(img2, 0, 0, w, h);

          const d1 = canvas1.getContext("2d").getImageData(0, 0, w, h).data;
          const d2 = canvas2.getContext("2d").getImageData(0, 0, w, h).data;

          let mse = 0;

          for (let i = 0; i < d1.length; i += 4) {
            for (let c = 0; c < 3; c++) {
              const diff = d1[i + c] - d2[i + c];
              mse += diff * diff;
            }
          }

          mse /= (w * h * 3);
          URL.revokeObjectURL(compressedUrl);

          if (mse === 0) resolve("∞ dB (lossless)");
          else {
            const psnr = 20 * Math.log10(255) - 10 * Math.log10(mse);
            resolve(`${psnr.toFixed(2)} dB`);
          }
        };
        img2.src = compressedUrl;
      };

      img1.src = originalDataUrl;
    });
  }

  // =========================
  // 🚀 COMPRESS
  // =========================
  document.getElementById("compressBtn").addEventListener("click", async () => {

    try {
      resetProgress();
      showLoader(true);
      updateProgress(10);

      const file = fileInput.files[0];

      if (!file) {
        setOutput("⚠️ Please select a file!", "error");
        showLoader(false);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setOutput("❌ File too large (max 50MB)", "error");
        showLoader(false);
        return;
      }

      const name = file.name.toLowerCase();
      const mode = modeSelect ? modeSelect.value : "auto";

      updateProgress(25);

      // 📄 TEXT / CSV
      if (name.endsWith(".txt") || name.endsWith(".csv")) {

        const uint8Data = new TextEncoder().encode(await file.text());
        lastCompressed.originalHash = await getSHA256(uint8Data);

        updateProgress(60);

        const compressed = pako.gzip(uint8Data);

        updateProgress(90);

        setOutput(
          compressionSummary("TEXT/CSV (gzip)", uint8Data.length, compressed.length),
          "success"
        );

        downloadBlob(new Blob([compressed]), file.name + ".gz");
      }

      // 🖼️ IMAGE
      else if (file.type.startsWith("image/")) {

        const dataUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(file);
        });

        const img = new Image();
        img.src = dataUrl;

        img.onload = () => {
          updateProgress(60);

          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          if (mode === "lossless") {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pngData = UPNG.encode([imageData.data.buffer], canvas.width, canvas.height, 0);
            const blob = new Blob([pngData], { type: "image/png" });

            updateProgress(90);

            setOutput(
              compressionSummary("IMAGE (LOSSLESS PNG)", file.size, blob.size),
              "success"
            );

            downloadBlob(blob, "compressed.png");
            showLoader(false);
          } else {
            canvas.toBlob(async (blob) => {
              updateProgress(90);

              const psnr = await calculatePSNR(dataUrl, blob);

              setOutput(
                compressionSummary("IMAGE (LOSSY JPEG)", file.size, blob.size) +
                `\nQuality (PSNR): ${psnr}`,
                "success"
              );

              downloadBlob(blob, "compressed.jpg");
              showLoader(false);
            }, "image/jpeg", 0.5);
          }
        };

        return;
      }

      // 🔊 WAV → MP3
      else if (name.endsWith(".wav")) {

        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer());

        updateProgress(60);

        const samples = audioBuffer.getChannelData(0);
        const mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);

        let mp3Data = [];

        for (let i = 0; i < samples.length; i += 1152) {
          const chunk = samples.subarray(i, i + 1152);
          const int16 = new Int16Array(chunk.length);

          for (let j = 0; j < chunk.length; j++) {
            int16[j] = chunk[j] * 32767;
          }

          const buf = mp3encoder.encodeBuffer(int16);
          if (buf.length > 0) mp3Data.push(buf);
        }

        mp3Data.push(mp3encoder.flush());

        updateProgress(90);

        const blob = new Blob(mp3Data, { type: "audio/mp3" });

        setOutput(
          compressionSummary("WAV → MP3", file.size, blob.size),
          "success"
        );

        downloadBlob(blob, "compressed.mp3");
      }

      // 🎥 VIDEO
      else if (name.endsWith(".mp4")) {

        const uint8Data = new Uint8Array(await file.arrayBuffer());

        updateProgress(70);

        const compressed = pako.gzip(uint8Data);

        updateProgress(90);

        setOutput(
          compressionSummary("VIDEO (LOSSLESS GZIP)", uint8Data.length, compressed.length),
          "success"
        );

        downloadBlob(new Blob([compressed]), file.name + ".gz");
      }

      else {
        setOutput("❌ Unsupported file type!", "error");
      }

      updateProgress(100);
      showLoader(false);

    } catch (err) {
      console.error(err);
      setOutput("❌ Compression failed", "error");
      showLoader(false);
      resetProgress();
    }
  });

  // =========================
  // 🔄 DECOMPRESS
  // =========================
  document.getElementById("decompressBtn").addEventListener("click", () => {

    try {
      resetProgress();
      showLoader(true);
      updateProgress(40);

      const file = fileInput.files[0];

      if (!file || !file.name.endsWith(".gz")) {
        setOutput("❌ Only .gz supported", "error");
        showLoader(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = async () => {

        updateProgress(80);

        const decompressed = pako.ungzip(new Uint8Array(reader.result));

        setOutput("✅ Decompressed successfully", "success");

        downloadBlob(new Blob([decompressed]), file.name.replace(".gz", ""));

        updateProgress(100);
        showLoader(false);
      };

      reader.readAsArrayBuffer(file);

    } catch (err) {
      console.error(err);
      setOutput("❌ Decompression failed", "error");
      showLoader(false);
    }
  });

});