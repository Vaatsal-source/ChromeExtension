📦 Smart File Compressor (Chrome Extension)
📌 Overview

Smart File Compressor is a browser-based Chrome extension that supports compression and decompression of multiple file types including text, images, audio, and video. It demonstrates both lossless and lossy compression techniques, along with performance metrics and verification mechanisms.

🎯 Objectives
Support multiple file formats: .txt, .csv, .png, .jpg, .wav, .mp3, .mp4
Apply appropriate compression techniques based on file type
Display:

1.Original size

2.Compressed size

3.Compression ratio

4.Space savings

5.Allow download of compressed files

6.Allow decompression for lossless formats

Provide:
1.Hash verification (lossless)

2.Quality metrics (lossy)

3.Handle errors gracefully

⚙️ Features

i)📄 Text & CSV Compression (Lossless)

1.Algorithm: GZIP (via pako)

2.Supports: .txt, .csv

3.Output: .gz file

4.Decompression supported

5.Integrity verified using SHA-256 hashing

ii)🖼️ Image Compression (Lossy)
1.Method: Canvas-based JPEG compression

2.Adjustable quality (default: 50%)

3.Output: .jpg

4.Metric: Quality % + size reduction

5.Note: Original image cannot be perfectly reconstructed

iii)🔊 Audio Compression

1.WAV → MP3 (Lossy)

2.Encoder: lamejs

3.Bitrate: 128 kbps

4.Metric: Bitrate + size reduction

5.MP3 Handling

6.Already compressed → analyzed only

7.Prevents unnecessary recompression

iv🎥 Video Compression (Simulated)
1.Method: GZIP compression (lossless fallback)

2.Output: .mp4.gz

3.Metric: Size reduction

4.Justification: Browser limitations prevent real-time encoding like H.264

i)🔄 Decompression
1.Supported for .gz files only

2.Works for:

3.Text

4.CSV

5.Video (GZIP fallback)

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
