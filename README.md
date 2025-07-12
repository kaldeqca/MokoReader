# Moko Reader

A clean, modern, and privacy-focused desktop e-book reader. Built with Electron, it leverages the power and flexibility of web technologies to deliver a portable, native-like experience on your machine.

Tired of the lack of good, free, and open-source e-book readers for desktop? Moko Reader is a standalone solution that requires no installation. It respects your privacy by processing all files locally—nothing is ever uploaded.

*(REMEMBER TO DO THIS Screenshot of Moko Reader in action)*

### ✨ Key Features

Moko Reader is packed with features designed for a great reading experience:

*   **Broad File Support:** Reads both **EPUB** and comic book archive formats (**CBZ**, **ZIP**).
*   **Integrated Library Management:** The application's core Node.js process automatically scans your `Library` folder on startup, extracts cover images, and generates optimized thumbnails for a beautiful, responsive grid view.
*   **Intuitive Navigation:**
    *   Browse your library with a clean, folder-based structure.
    *   Breadcrumb navigation makes it easy to move between folders.
    *   Keyboard shortcuts (`ArrowLeft`, `ArrowRight`) for page-turning.
*   **Customizable Reading Experience:**
    *   **Light & Dark Modes:** Switch between themes for comfortable reading day or night. Your preference is saved across sessions.
    *   **Page Modes:**
        *   **Two-Page View:** The default for EPUBs, simulating a real book.
        *   **One-Page View:** The default for comics (CBZ), ideal for vertical reading.
    *   **Interactive Zoom & Pan:**
        *   Zoom in on EPUB content for better readability.
        *   For CBZ files in one-page mode, use the mouse wheel to zoom and click-and-drag to pan around the image.
*   **Smart & Efficient Interface:**
    *   **Language Agnostic:** The UI is primarily icon-driven, making it universally understandable with minimal text.
    *   **Integrated Search:** Quickly find books within your current library folder.
    *   **Immersive Reader UI:** The header and footer in the reader view automatically hide for a distraction-free experience and reappear on hover.
    *   **Drag-to-Scroll:** Hold the **spacebar** and drag with your mouse to pan around zoomed-in content, just like in professional design software.
*   **Performance & Privacy:**
    *   **No Frameworks:** Built with pure, vanilla JavaScript for a fast and lightweight experience.
    *   **Local First:** All file processing and reading happens directly on your machine. No files are ever sent over the network.

### 🛠️ Tech Stack & Architecture

This project is a self-contained desktop application built on the Electron framework, which allows it to run a Node.js backend (main process) and a web-based frontend (renderer process) together.

*   **Core Framework:** **Electron**
*   **Main Process (Node.js Backend):**
    *   Handles all file system operations, including scanning the library and generating previews.
    *   **Sharp:** A high-performance Node.js library for fast and efficient image resizing to create thumbnails.
    *   **JSZip (Node):** Used to inspect `.epub` and `.cbz` archives to extract cover images without fully unzipping them.
    *   **xml2js:** To parse OPF and container XML data within EPUB files to locate metadata and cover paths.
*   **Renderer Process (Frontend):**
    *   **HTML5, CSS3** (with CSS Variables for theming), **Vanilla JavaScript (ES6+)**
    *   **epub.js:** For rendering and parsing EPUB files in the reader view.
    *   **jszip.js (browser version):** For reading and displaying images from CBZ/ZIP archives directly in the reader view.
*   **Build System:** **electron-builder** to package the application into a portable executable.

### 🚀 Getting Started

#### For Users (Running the Portable App)

1.  Download the latest release for your operating system.
2.  Unzip the folder.
3.  Inside the unzipped folder, create a new folder named `Library`.
4.  Copy your `.epub` and `.cbz` files into the `Library` folder.
5.  Run `Moko Reader.exe` (or the equivalent for your OS). The app will automatically find your books and generate covers.

#### For Developers (Running from Source)

**Prerequisites:**
*   Node.js (LTS version recommended)
*   npm or yarn

**Instructions:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/moko-reader.git
    cd moko-reader
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the app in development mode:**
    This will start the application with DevTools enabled.
    ```bash
    npm start
    ```

4.  **Package the application:**
    This will build a portable executable in the `dist` folder.
    ```bash
    npm run package
    ```
