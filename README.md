# ⚡ Smart File Compressor Extension  
**Organization:** FUUDU DEVS  
**Status:** ✅ Submitted — MACS JC Project 2  

---

## 📌 Overview
Smart File Compressor is a high-performance Chrome Extension designed to bridge the gap between browser utility and data efficiency. It empowers users to compress and decompress assets—text, images, audio, and video—locally within the browser. By leveraging a hybrid approach of **Lossless** (GZIP, PNG) and **Lossy** (JPEG, MP3) algorithms, it ensures optimal storage savings without sacrificing essential data integrity.

---

## 👥 Team & Contributions

| Name | Role & Responsibility | Contribution |
| :--- | :--- | :--- |
| **Vaatsalya Srivastava** | **Lead Architect** (Integration, Logic Flow & Full-Stack) | **32%** |
| **Harkirath Singh** | **Media Lead** (Video Handling & Image Optimization) | **17%** |
| **Chirag Singh Jadon** | **Core Logic** (Text/CSV Compression & GZIP) | **17%** |
| **Nachiket** | **Audio Engineer** (WAV to MP3 & Bitrate Logic) | **17%** |
| **Hardik** | **QA & Docs** (Testing & SHA-256 Verification) | **17%** |

---

## 🚀 Key Features
- **Multi-Format Support:**
  - 📄 **Documents:** TXT, CSV (Lossless via GZIP)
  - 🖼️ **Visuals:** JPEG (Lossy) / PNG (Lossless via UPNG)
  - 🔊 **Audio:** WAV → MP3 (Lossy via LAME.js)
  - 🎥 **Video:** MP4 (High-efficiency GZIP Simulation)
- **Dynamic Compression Modes:** Toggle between **Lossy**, **Lossless**, and **Auto**.
- **Advanced Analytics:** Real-time metrics including Ratio, Size, and % Savings.
- **Security:** SHA-256 hash comparison for bit-perfect reconstruction.
- **Modern UI:** Drag-and-drop interface with sleek progress bars.

---

## ⚙️ Installation
1. **Clone/Download** this repository.
2. Open **Google Chrome** and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** (top-right corner).
4. Click **Load unpacked** and select the project directory.

---

## 📊 Performance Benchmark

| File Type | Original Size | Compressed Size | Ratio | Savings |
| :--- | :--- | :--- | :--- | :--- |
| Plain Text | 120 KB | 35 KB | 3.42:1 | 70% |
| Image (JPEG) | 500 KB | 180 KB | 2.77:1 | 64% |
| Audio (WAV→MP3) | 5.0 MB | 1.2 MB | 4.16:1 | 76% |
| Video (MP4) | 10.0 MB | 9.2 MB | 1.08:1 | 8% |

---

## 🧠 Technical Stack
- **Pako (GZIP):** High-speed DEFLATE/INFLATE for text data.
- **UPNG.js:** Advanced engine for lossless PNG quality.
- **Canvas API:** Client-side JPEG quantization.
- **LAME.js:** Pure JS MP3 encoder for transcoding.
- **Crypto API:** Native SHA-256 hashing for validation.

---

## ⚠️ Known Constraints
- **Size Limit:** Optimized for files up to 50 MB.
- **Video Scope:** Currently uses GZIP simulation.
- **Processing:** Dependent on client-side CPU resources.

---

## 📚 Resources
- [Pako Library](https://github.com/nodeca/pako)
- [LAME.js Encoder](https://github.com/zhuker/lamejs)
- [UPNG.js Engine](https://github.com/photopea/UPNG.js)

---
**FUUDU DEVS** — *Optimizing the Web, One Byte at a Time.*
