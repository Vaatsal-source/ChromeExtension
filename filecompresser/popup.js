document.getElementById("compressBtn").addEventListener("click", async () => {
    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Please select a file!");
        return;
    }

    // Only handle text for now
    if (!file.type.includes("text")) {
        alert("Only text files supported for now!");
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        const textData = reader.result;

        // Convert text to Uint8Array
        const encoder = new TextEncoder();
        const uint8Data = encoder.encode(textData);

        // 🔥 Compress using pako (GZIP)
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
    };

    reader.readAsText(file);
});