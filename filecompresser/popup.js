document.getElementById("compressBtn").addEventListener("click", () => {
    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Please select a file!");
        return;
    }

    document.getElementById("output").innerText =
        `File Selected: ${file.name}, Size: ${file.size} bytes`;
});