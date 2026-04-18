document.addEventListener("DOMContentLoaded", () => {
  // Stores data about the last compression for decompression/quality checks
  let lastCompressed = {
    originalHash: "",
    originalSize: 0,
    originalSampleRate: 0,
    originalDuration: 0,
    type: "", // "lossless" | "lossy-image" | "lossy-audio"
    originalImageDataUrl: "",
    compressedBitrate: 128,
  };

  const output = document.getElementById("output");
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const fileNameLabel = document.getElementById("fileName");

  // ── Helpers ──────────────────────────────────────────────

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
    const savings = (((original - compressed) / original) * 100).toFixed(1);
    return (
      `[${label}]\n` +
      `Original:   ${formatBytes(original)}\n` +
      `Compressed: ${formatBytes(compressed)}\n` +
      `Saved:      ${formatBytes(original - compressed)} (${savings}%)\n` +
      `Ratio:      ${ratio}:1`
    );
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
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // ── PSNR for image quality metric ──
  // PSNR = 20 * log10(255) - 10 * log10(MSE)
  async function calculatePSNR(originalDataUrl, compressedBlob) {
    return new Promise((resolve) => {
      const compressedUrl = URL.createObjectURL(compressedBlob);
      const canvas1 = document.createElement("canvas");
      const canvas2 = document.createElement("canvas");
      const img1 = new Image();
      const img2 = new Image();

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
            let quality = psnr > 40 ? "Excellent" : psnr > 35 ? "Good" : psnr > 30 ? "Acceptable" : "Poor";
            resolve(`${psnr.toFixed(2)} dB (${quality})`);
          }
        };
        img2.src = compressedUrl;
      };
      img1.src = originalDataUrl;
    });
  }

  // ── Drag-and-drop ─────────────────────────────────────────

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      fileNameLabel.textContent = "📄 " + e.dataTransfer.files[0].name;
    }
  });

  fileInput.addEventListener("change", () => {
    fileNameLabel.textContent = fileInput.files[0]
      ? "📄 " + fileInput.files[0].name
      : "";
  });

  // ── COMPRESS ──────────────────────────────────────────────

  document.getElementById("compressBtn").addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      setOutput("⚠️ Please select a file first.", "error");
      return;
    }

    // File size guard: warn over 50MB
    if (file.size > 50 * 1024 * 1024) {
      setOutput("❌ File too large (max 50MB). Large files may crash the extension.", "error");
      return;
    }

    setOutput("⏳ Compressing…");
    const name = file.name.toLowerCase();

    try {

      // ── TEXT (.txt) ──
      if (name.endsWith(".txt")) {
        const uint8Data = new TextEncoder().encode(await file.text());
        lastCompressed.originalHash = await getSHA256(uint8Data);
        lastCompressed.originalSize = uint8Data.length;
        lastCompressed.type = "lossless";
        const compressed = pako.gzip(uint8Data);
        setOutput(compressionSummary("TEXT (gzip)", uint8Data.length, compressed.length), "success");
        downloadBlob(new Blob([compressed], { type: "application/gzip" }), file.name + ".gz");
      }

      // ── CSV (.csv) ──
      else if (name.endsWith(".csv")) {
        const uint8Data = new TextEncoder().encode(await file.text());
        lastCompressed.originalHash = await getSHA256(uint8Data);
        lastCompressed.originalSize = uint8Data.length;
        lastCompressed.type = "lossless";
        const compressed = pako.gzip(uint8Data);
        setOutput(compressionSummary("CSV (gzip)", uint8Data.length, compressed.length), "success");
        downloadBlob(new Blob([compressed], { type: "application/gzip" }), file.name + ".gz");
      }

      // ── IMAGE (.png, .jpg, .jpeg, etc.) ──
      else if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });

        lastCompressed.originalImageDataUrl = dataUrl;
        lastCompressed.type = "lossy-image";
        lastCompressed.originalSize = file.size;

        await new Promise((resolve, reject) => {
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d").drawImage(img, 0, 0);

            canvas.toBlob(async (blob) => {
              if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
              const psnr = await calculatePSNR(dataUrl, blob);
              setOutput(
                compressionSummary("IMAGE (JPEG 50% quality)", file.size, blob.size) +
                `\n\nQuality (PSNR): ${psnr}`,
                "success"
              );
              lastCompressed.compressedBlob = blob;
              downloadBlob(blob, "compressed_" + file.name.replace(/\.[^.]+$/, "") + ".jpg");
              resolve();
            }, "image/jpeg", 0.5);
          };
          img.onerror = reject;
        });
      }

      // ── AUDIO WAV → MP3 ──
      else if (name.endsWith(".wav")) {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const sampleRate = audioBuffer.sampleRate;
        const bitrate = 128;
        lastCompressed.originalSize = file.size;
        lastCompressed.originalSampleRate = sampleRate;
        lastCompressed.originalDuration = audioBuffer.duration;
        lastCompressed.compressedBitrate = bitrate;
        lastCompressed.type = "lossy-audio";

        const samples = audioBuffer.getChannelData(0);
        const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, bitrate);
        const mp3Data = [];
        const blockSize = 1152;

        for (let i = 0; i < samples.length; i += blockSize) {
          const chunk = samples.subarray(i, i + blockSize);
          const int16 = new Int16Array(chunk.length);
          for (let j = 0; j < chunk.length; j++) {
            int16[j] = Math.max(-32768, Math.min(32767, chunk[j] * 32767));
          }
          const buf = mp3encoder.encodeBuffer(int16);
          if (buf.length > 0) mp3Data.push(buf);
        }
        const end = mp3encoder.flush();
        if (end.length > 0) mp3Data.push(end);

        const blob = new Blob(mp3Data, { type: "audio/mp3" });
        const actualBitrate = ((blob.size * 8) / audioBuffer.duration / 1000).toFixed(0);

        setOutput(
          compressionSummary("AUDIO (WAV→MP3)", file.size, blob.size) +
          `\n\nQuality metric:\n` +
          `  Target bitrate:  ${bitrate} kbps\n` +
          `  Actual bitrate:  ${actualBitrate} kbps\n` +
          `  Sample rate:     ${sampleRate} Hz\n` +
          `  Duration:        ${audioBuffer.duration.toFixed(2)}s`,
          "success"
        );
        downloadBlob(blob, file.name.replace(/\.wav$/i, ".mp3"));
      }

      // ── AUDIO MP3 (re-compress via gzip for structure) ──
      else if (name.endsWith(".mp3")) {
        const uint8Data = new Uint8Array(await file.arrayBuffer());
        lastCompressed.originalHash = await getSHA256(uint8Data);
        lastCompressed.originalSize = uint8Data.length;
        lastCompressed.type = "lossless";
        const compressed = pako.gzip(uint8Data);
        // Estimate bitrate from file
        const estimatedBitrate = ((file.size * 8) / 1000).toFixed(0);
        setOutput(
          compressionSummary("MP3 (gzip wrap)", uint8Data.length, compressed.length) +
          `\n\nQuality metric:\n` +
          `  Estimated bitrate: ~${estimatedBitrate} kbps\n` +
          `  ⚠️ MP3 is already lossy — gzip preserves it exactly.`,
          "success"
        );
        downloadBlob(new Blob([compressed], { type: "application/gzip" }), file.name + ".gz");
      }

      // ── VIDEO MP4 ──
      else if (name.endsWith(".mp4")) {
        const uint8Data = new Uint8Array(await file.arrayBuffer());
        lastCompressed.originalHash = await getSHA256(uint8Data);
        lastCompressed.originalSize = uint8Data.length;
        lastCompressed.type = "lossless";
        const compressed = pako.gzip(uint8Data);
        setOutput(
          compressionSummary("VIDEO (gzip)", uint8Data.length, compressed.length) +
          "\n\n⚠️ MP4 is already compressed internally.\nFor real re-encoding use HandBrake or FFmpeg.",
          "success"
        );
        downloadBlob(new Blob([compressed], { type: "application/gzip" }), file.name + ".gz");
      }

      // ── UNSUPPORTED ──
      else {
        setOutput(
          "❌ Unsupported file type: ." + file.name.split(".").pop() +
          "\n\nSupported formats:\n  Text: .txt, .csv\n  Image: .jpg, .png, .gif, .webp\n  Audio: .wav, .mp3\n  Video: .mp4",
          "error"
        );
      }

    } catch (err) {
      console.error(err);
      setOutput("❌ Compression failed:\n" + err.message, "error");
    }
  });

  // ── DECOMPRESS ────────────────────────────────────────────

  document.getElementById("decompressBtn").addEventListener("click", () => {
    const file = fileInput.files[0];

    if (!file) {
      setOutput("⚠️ Please select a file to decompress.", "error");
      return;
    }

    const name = file.name.toLowerCase();

    // ── Decompress .gz (lossless rebuild) ──
    if (name.endsWith(".gz")) {
      setOutput("⏳ Decompressing…");
      const reader = new FileReader();
      reader.onload = async function () {
        try {
          const compressedData = new Uint8Array(reader.result);
          const decompressed = pako.ungzip(compressedData);
          const newHash = await getSHA256(decompressed);

          let hashMsg;
          if (lastCompressed.originalHash && lastCompressed.type === "lossless") {
            hashMsg = newHash === lastCompressed.originalHash
              ? "✅ Perfect rebuild — hash matches original!"
              : "⚠️ Hash mismatch — file may be corrupted.";
          } else {
            hashMsg = "ℹ️ Hash check skipped (no original session data).";
          }

          setOutput(
            `[DECOMPRESSED]\nSize: ${formatBytes(decompressed.length)}\n\n${hashMsg}`,
            "success"
          );
          downloadBlob(new Blob([decompressed]), file.name.replace(/\.gz$/i, ""));
        } catch (err) {
          console.error(err);
          setOutput("❌ Decompression failed.\nMake sure the file is a valid .gz archive.", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // ── Lossy image rebuild quality check ──
    else if (file.type.startsWith("image/")) {
      if (!lastCompressed.originalImageDataUrl) {
        setOutput("⚠️ No original image in session to compare against.\nCompress an image first, then upload the result here.", "error");
        return;
      }
      setOutput("⏳ Checking image quality…");
      const reader = new FileReader();
      reader.onload = async function () {
        try {
          const blob = new Blob([reader.result], { type: file.type });
          const psnr = await calculatePSNR(lastCompressed.originalImageDataUrl, blob);
          setOutput(
            `[LOSSY IMAGE REBUILD]\nSize: ${formatBytes(file.size)}\n\nQuality (PSNR): ${psnr}\n\nNote: Lossy compression — original pixels cannot be perfectly restored.`,
            "success"
          );
        } catch (err) {
          setOutput("❌ Quality check failed: " + err.message, "error");
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // ── MP3 quality info ──
    else if (name.endsWith(".mp3")) {
      if (lastCompressed.type === "lossy-audio") {
        setOutput(
          `[LOSSY AUDIO REBUILD]\n\nQuality metric:\n` +
          `  Compressed bitrate: ${lastCompressed.compressedBitrate} kbps\n` +
          `  Original size:      ${formatBytes(lastCompressed.originalSize)}\n` +
          `  Sample rate:        ${lastCompressed.originalSampleRate} Hz\n` +
          `  Duration:           ${lastCompressed.originalDuration.toFixed(2)}s\n\n` +
          `ℹ️ MP3 is lossy — original audio cannot be perfectly restored.\n` +
          `   Higher bitrate = better quality.`,
          "success"
        );
      } else {
        setOutput(
          "ℹ️ MP3 quality info:\nMP3 is a lossy format. Original audio cannot be perfectly restored from MP3.\nFor lossless audio, use WAV or FLAC.",
          ""
        );
      }
    }

    else {
      setOutput(
        "❌ Cannot decompress this file type directly.\nUpload a .gz file to decompress, or a compressed image/.mp3 to check quality.",
        "error"
      );
    }
  });
});
