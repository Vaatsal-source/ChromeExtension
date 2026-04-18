document.addEventListener("DOMContentLoaded", () => {
  let originalHash = "";

  // 🔐 Hash function
  async function getSHA256(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // 🚀 COMPRESS
  document.getElementById("compressBtn").addEventListener("click", async () => {
    const file = document.getElementById("fileInput").files[0];

    if (!file) {
      alert("Please select a file!");
      return;
    }

    // =========================
    // 📄 TEXT
    // =========================
    if (file.name.endsWith(".txt")) {
      const text = await file.text();
      const encoder = new TextEncoder();
      const uint8Data = encoder.encode(text);

      originalHash = await getSHA256(uint8Data);

      const compressed = pako.gzip(uint8Data);

      const originalSize = uint8Data.length;
      const compressedSize = compressed.length;

      const ratio = (originalSize / compressedSize).toFixed(2);
      const savings = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(2);

      document.getElementById("output").innerText = `
[TEXT COMPRESSION]
Original: ${originalSize} bytes
Compressed: ${compressedSize} bytes
Ratio: ${ratio}:1
Saved: ${savings}%
      `;

      const blob = new Blob([compressed], { type: "application/gzip" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name + ".gz";
      a.click();

      URL.revokeObjectURL(url);
    }

    // =========================
    // 🖼️ IMAGE
    // =========================
    else if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = function () {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const quality = 0.5;

          canvas.toBlob(
            (blob) => {
              const originalSize = file.size;
              const compressedSize = blob.size;

              const ratio = (originalSize / compressedSize).toFixed(2);
              const savings = (
                ((originalSize - compressedSize) / originalSize) *
                100
              ).toFixed(2);

              document.getElementById("output").innerText = `
[IMAGE COMPRESSION]
Original: ${originalSize} bytes
Compressed: ${compressedSize} bytes
Ratio: ${ratio}:1
Saved: ${savings}%
            `;

              const url = URL.createObjectURL(blob);

              const a = document.createElement("a");
              a.href = url;
              a.download = "compressed.jpg";
              a.click();

              URL.revokeObjectURL(url);
            },
            "image/jpeg",
            quality,
          );
        };
      };

      reader.readAsDataURL(file);
    }

    // =========================
    // 🔊 AUDIO (WAV → MP3)
    // =========================
    else if (file.name.endsWith(".wav")) {
      try {
        const audioContext = new AudioContext();

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const samples = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;

        const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);

        const blockSize = 1152;
        let mp3Data = [];

        for (let i = 0; i < samples.length; i += blockSize) {
          const chunk = samples.subarray(i, i + blockSize);

          const int16Chunk = new Int16Array(chunk.length);
          for (let j = 0; j < chunk.length; j++) {
            int16Chunk[j] = chunk[j] * 32767;
          }

          const mp3buf = mp3encoder.encodeBuffer(int16Chunk);
          if (mp3buf.length > 0) mp3Data.push(mp3buf);
        }

        const end = mp3encoder.flush();
        if (end.length > 0) mp3Data.push(end);

        const blob = new Blob(mp3Data, { type: "audio/mp3" });

        const originalSize = file.size;
        const compressedSize = blob.size;

        const ratio = (originalSize / compressedSize).toFixed(2);
        const savings = (
          ((originalSize - compressedSize) / originalSize) *
          100
        ).toFixed(2);

        document.getElementById("output").innerText = `
[AUDIO COMPRESSION]
Original: ${originalSize} bytes
Compressed: ${compressedSize} bytes
Ratio: ${ratio}:1
Saved: ${savings}%
        `;

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "compressed.mp3";
        a.click();

        URL.revokeObjectURL(url);
      } catch (err) {
        alert("Audio compression failed!");
        console.error(err);
      }
    }

    // =========================
    // 🎥 VIDEO (MP4 - simulated compression)
    // =========================
    else if (file.name.endsWith(".mp4")) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Data = new Uint8Array(arrayBuffer);

      const compressed = pako.gzip(uint8Data);

      const originalSize = uint8Data.length;
      const compressedSize = compressed.length;

      const ratio = (originalSize / compressedSize).toFixed(2);
      const savings = (
        ((originalSize - compressedSize) / originalSize) *
        100
      ).toFixed(2);

      document.getElementById("output").innerText = `
[VIDEO COMPRESSION - SIMULATED]
Original: ${originalSize} bytes
Compressed: ${compressedSize} bytes
Ratio: ${ratio}:1
Saved: ${savings}%
      `;

      const blob = new Blob([compressed], { type: "application/gzip" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name + ".gz";
      a.click();

      URL.revokeObjectURL(url);
    } else {
      alert("Unsupported file type!");
    }
  });

  // 🔄 DECOMPRESS (TEXT + VIDEO GZIP)
  document.getElementById("decompressBtn").addEventListener("click", () => {
    const file = document.getElementById("fileInput").files[0];

    if (!file || !file.name.endsWith(".gz")) {
      alert("Upload a .gz file!");
      return;
    }
    if (file.name.endsWith(".jpg") || file.name.endsWith(".mp3")) {
      alert("Lossy files cannot be decompressed to original!");
      return;
    }

    const reader = new FileReader();

    reader.onload = async function () {
      const compressedData = new Uint8Array(reader.result);
      const decompressed = pako.ungzip(compressedData);

      const newHash = await getSHA256(decompressed);

      if (newHash === originalHash) {
        document.getElementById("output").innerText =
          "✅ Perfect Rebuild! Hash Match";
      } else {
        document.getElementById("output").innerText =
          "⚠️ Decompressed (Hash mismatch expected for video)";
      }

      const blob = new Blob([decompressed]);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".gz", "");
      a.click();

      URL.revokeObjectURL(url);
    };

    reader.readAsArrayBuffer(file);
  });
});
