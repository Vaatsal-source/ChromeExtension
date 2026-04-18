document.addEventListener("DOMContentLoaded", () => {

let originalHash = "";

// 🔐 Hash function
async function getSHA256(data) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// 🚀 COMPRESS
document.getElementById("compressBtn").addEventListener("click", () => {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    alert("Please select a file!");
    return;
  }

  if (!file.name.endsWith(".txt")) {
    alert("Only .txt files supported for now!");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const textData = reader.result;

    const encoder = new TextEncoder();
    const uint8Data = encoder.encode(textData);

    // 🔐 Generate hash
    originalHash = await getSHA256(uint8Data);
    console.log("Original Hash:", originalHash);

    // 🔥 Compress
    const compressed = pako.gzip(uint8Data);

    const originalSize = uint8Data.length;
    const compressedSize = compressed.length;

    const ratio = (originalSize / compressedSize).toFixed(2);
    const savings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);

    document.getElementById("output").innerText = `
Original Size: ${originalSize} bytes
Compressed Size: ${compressedSize} bytes
Compression Ratio: ${ratio}:1
Space Saved: ${savings}%
    `;

    // 📥 Download compressed file
    const blob = new Blob([compressed], { type: "application/gzip" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name + ".gz";
    a.click();

    URL.revokeObjectURL(url);
  };

  reader.readAsText(file);
});


// 🔄 DECOMPRESS
document.getElementById("decompressBtn").addEventListener("click", () => {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    alert("Please select a file!");
    return;
  }

  if (!file.name.endsWith(".gz")) {
    alert("Please upload a .gz file!");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    try {
      const compressedData = new Uint8Array(reader.result);

      // 🔥 Decompress
      const decompressed = pako.ungzip(compressedData);

      // 🔐 Hash decompressed data
      const newHash = await getSHA256(decompressed);
      console.log("Decompressed Hash:", newHash);

      const decoder = new TextDecoder();
      const originalText = decoder.decode(decompressed);

      // ✅ Compare hashes
      if (newHash === originalHash) {
        document.getElementById("output").innerText =
          "✅ Perfect Rebuild! Hash Match";
      } else {
        document.getElementById("output").innerText =
          "❌ Rebuild Failed! Hash Mismatch";
      }

      // 📥 Download decompressed file
      const blob = new Blob([originalText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".gz", "");
      a.click();

      URL.revokeObjectURL(url);

    } catch (err) {
      alert("Decompression failed!");
      console.error(err);
    }
  };

  reader.readAsArrayBuffer(file);
});

});