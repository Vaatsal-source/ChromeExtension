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

    reader.onload = function () {
        const textData = reader.result;

        const encoder = new TextEncoder();
        const uint8Data = encoder.encode(textData);

        // 🔥 Compress
        const compressed = pako.gzip(uint8Data);

        const originalSize = uint8Data.length;
        const compressedSize = compressed.length;

        const ratio = (originalSize / compressedSize).toFixed(2);
        const savings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);

        // ✅ Show stats
        document.getElementById("output").innerText = `
Original Size: ${originalSize} bytes
Compressed Size: ${compressedSize} bytes
Compression Ratio: ${ratio}:1
Space Saved: ${savings}%
        `;

        // 🚀 NEW: Download compressed file
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

    reader.onload = function () {
        try {
            const compressedData = new Uint8Array(reader.result);

            // 🔥 Decompress
            const decompressed = pako.ungzip(compressedData);

            const decoder = new TextDecoder();
            const originalText = decoder.decode(decompressed);

            // Show preview
            document.getElementById("output").innerText =
                "Decompression successful!";

            // 🚀 Download decompressed file
            const blob = new Blob([originalText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "decompressed.txt";
            a.click();

            URL.revokeObjectURL(url);

        } catch (err) {
            alert("Decompression failed! Invalid file.");
            console.error(err);
        }
    };

    reader.readAsArrayBuffer(file);
});