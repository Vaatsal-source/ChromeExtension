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

          if (mse === 0) {
            resolve("∞ dB (lossless)");
          } else {
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
      const file = fileInput.files[0];

      if (!file) {
        setOutput("⚠️ Please select a file!", "error");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setOutput("❌ File too large (max 50MB)", "error");
        return;
      }

      const name = file.name.toLowerCase();

      // 📄 TEXT / CSV
      if (name.endsWith(".txt") || name.endsWith(".csv")) {

        const uint8Data = new TextEncoder().encode(await file.text());

        lastCompressed.originalHash = await getSHA256(uint8Data);
        lastCompressed.originalSize = uint8Data.length;
        lastCompressed.type = "lossless";

        const compressed = pako.gzip(uint8Data);

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

        lastCompressed.originalImageDataUrl = dataUrl;
        lastCompressed.originalSize = file.size;
        lastCompressed.type = "lossy-image";

        const img = new Image();
        img.src = dataUrl;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          canvas.getContext("2d").drawImage(img, 0, 0);

          canvas.toBlob(async (blob) => {

            const psnr = await calculatePSNR(dataUrl, blob);

            setOutput(
              compressionSummary("IMAGE (JPEG 50%)", file.size, blob.size) +
              `\nQuality (PSNR): ${psnr}`,
              "success"
            );

            downloadBlob(blob, "compressed.jpg");

          }, "image/jpeg", 0.5);
        };
      }

      // 🔊 MP3
      else if (name.endsWith(".mp3")) {

        setOutput(
`[AUDIO ANALYSIS]
MP3 already compressed
Size: ${formatBytes(file.size)}
⚠️ Further compression reduces quality`
        );

        downloadBlob(file, "reused.mp3");
      }

      // 🔊 WAV → MP3
      else if (name.endsWith(".wav")) {

        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer());

        const samples = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const bitrate = 128;

        lastCompressed.type = "lossy-audio";

        const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, bitrate);

        let mp3Data = [];
        const blockSize = 1152;

        for (let i = 0; i < samples.length; i += blockSize) {
          const chunk = samples.subarray(i, i + blockSize);

          const int16 = new Int16Array(chunk.length);
          for (let j = 0; j < chunk.length; j++) {
            int16[j] = chunk[j] * 32767;
          }

          const buf = mp3encoder.encodeBuffer(int16);
          if (buf.length > 0) mp3Data.push(buf);
        }

        mp3Data.push(mp3encoder.flush());

        const blob = new Blob(mp3Data, { type: "audio/mp3" });

        setOutput(
          compressionSummary("WAV → MP3", file.size, blob.size) +
          `\nBitrate: ${bitrate} kbps`,
          "success"
        );

        downloadBlob(blob, "compressed.mp3");
      }

      // 🎥 VIDEO
      else if (name.endsWith(".mp4")) {

        const uint8Data = new Uint8Array(await file.arrayBuffer());

        lastCompressed.originalHash = await getSHA256(uint8Data);
        lastCompressed.type = "lossless";

        const compressed = pako.gzip(uint8Data);

        setOutput(
          compressionSummary("VIDEO (gzip)", uint8Data.length, compressed.length) +
          "\n⚠️ MP4 already compressed",
          "success"
        );

        downloadBlob(new Blob([compressed]), file.name + ".gz");
      }

      else {
        setOutput("❌ Unsupported file type!", "error");
      }

    } catch (err) {
      console.error(err);
      setOutput("❌ Compression failed", "error");
    }
  });

  // =========================
  // 🔄 DECOMPRESS
  // =========================

  document.getElementById("decompressBtn").addEventListener("click", () => {

    const file = fileInput.files[0];

    if (!file) {
      setOutput("⚠️ Select a file!", "error");
      return;
    }

    if (file.name.endsWith(".gz")) {

      const reader = new FileReader();

      reader.onload = async () => {

        const decompressed = pako.ungzip(new Uint8Array(reader.result));
        const newHash = await getSHA256(decompressed);

        if (newHash === lastCompressed.originalHash) {
          setOutput("✅ Perfect Rebuild!", "success");
        } else {
          setOutput("⚠️ Decompressed (hash mismatch expected)");
        }

        downloadBlob(new Blob([decompressed]), file.name.replace(".gz", ""));
      };

      reader.readAsArrayBuffer(file);
    }

    else {
      setOutput("❌ Only .gz supported for decompression", "error");
    }
  });

});