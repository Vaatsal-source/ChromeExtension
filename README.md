📦 Smart File Compressor (Chrome Extension)
📌 Overview

Smart File Compressor is a browser-based Chrome extension that supports compression and decompression of multiple file types including text, images, audio, and video. It demonstrates both lossless and lossy compression techniques, along with performance metrics and verification mechanisms.

🎯 Objectives
Support multiple file formats: .txt, .csv, .png, .jpg, .wav, .mp3, .mp4
Apply appropriate compression techniques based on file type
Display:
Original size
Compressed size
Compression ratio
Space savings
Allow download of compressed files
Allow decompression for lossless formats
Provide:
Hash verification (lossless)
Quality metrics (lossy)
Handle errors gracefully
⚙️ Features
📄 Text & CSV Compression (Lossless)
Algorithm: GZIP (via pako)
Supports: .txt, .csv
Output: .gz file
Decompression supported
Integrity verified using SHA-256 hashing
🖼️ Image Compression (Lossy)
Method: Canvas-based JPEG compression
Adjustable quality (default: 50%)
Output: .jpg
Metric: Quality % + size reduction
Note: Original image cannot be perfectly reconstructed
🔊 Audio Compression
WAV → MP3 (Lossy)
Encoder: lamejs
Bitrate: 128 kbps
Metric: Bitrate + size reduction
MP3 Handling
Already compressed → analyzed only
Prevents unnecessary recompression
🎥 Video Compression (Simulated)
Method: GZIP compression (lossless fallback)
Output: .mp4.gz
Metric: Size reduction
Justification: Browser limitations prevent real-time encoding like H.264
🔄 Decompression
Supported for .gz files only
Works for:
Text
CSV
Video (GZIP fallback)
Uses SHA-256 hash comparison for verification
🔐 Hash Verification
Algorithm: SHA-256 (Web Crypto API)
Ensures:
Perfect reconstruction for lossless compression
Output:
✅ Match → Successful rebuild
⚠️ Mismatch → Expected for lossy formats
⚠️ Error Handling
Unsupported file types rejected
File size limit: 10MB
Graceful alerts for:
Missing files
Invalid formats
Decompression errors
🧠 Compression Types Used
Type	Files	Method	Reversible
Lossless	TXT, CSV, MP4	GZIP	✅ Yes
Lossy	JPG, WAV → MP3	Encoding	❌ No
📊 Metrics Displayed
Original Size (bytes)
Compressed Size (bytes)
Compression Ratio
Space Saved (%)
Quality % (images)
Bitrate (audio)
🏗️ Tech Stack
HTML, CSS, JavaScript
Chrome Extension APIs
pako (GZIP)
lamejs (Audio encoding)
Web APIs:
FileReader
Canvas API
Web Audio API
Web Crypto API
📂 Project Structure
file-compressor-extension/
│── manifest.json
│── popup.html
│── popup.js
│── pako.min.js
│── lame.min.js
▶️ How to Use
Load extension in Chrome:
Go to chrome://extensions/
Enable Developer Mode
Click Load Unpacked
Select project folder
Use the extension:
Upload a file
Click Compress
Download output
For decompression:
Upload .gz file
Click Decompress
⚠️ Limitations
Video compression is simulated (GZIP, not codec-based)
Image & audio are lossy → cannot be fully restored
Only WAV supported for audio compression input
Large files (>10MB) restricted for performance
🚀 Future Improvements
Real video compression using ffmpeg.wasm
Support more formats (PDF, ZIP, etc.)
Adjustable bitrate & image quality sliders
Drag-and-drop UI
Progress indicators
🎓 Conclusion

This project successfully demonstrates:

Practical implementation of compression algorithms
Difference between lossless and lossy compression
Real-world constraints in browser environments
Efficient handling of multiple file types
📸 Screenshots (Add Before Submission)

Include:

UI of extension
Compression output (text/image/audio/video)
Hash match result
👨‍💻 Authors

Vaatsalya Srivastava
Harkirath Bhaiya
Hardik Yadav
Chirag Singh Jadon
