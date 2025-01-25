# PDF Merger Tool

A modern and user-friendly web application for merging PDF files and images into a single document. This project is built with React, Framer Motion, and PDF-lib, offering an elegant interface and smooth animations for file management and processing.

## Features

- Drag and drop support for file uploads.
- Combine PDFs and images (PNG, JPG, JPEG, GIF, BMP, TIFF) into a single PDF.
- Real-time progress bar for file merging.
- Intuitive UI with animations using Framer Motion.
- Reorder files via drag-and-drop functionality.
- Supports both PDF metadata cleanup and efficient file handling.

## Built With

- **React**: Frontend framework for building the user interface.
- **Framer Motion**: For animations and transitions.
- **PDF-lib**: For PDF manipulation and merging.
- **React-DnD**: For drag-and-drop support.
- **Lucide Icons**: For clean and modern UI icons.
- **Tailwind CSS**: For a responsive and minimal design.

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/adibshirazi/PDFMerger.git
   cd PDFMerger
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Usage

1. Drag and drop files into the dropzone or use the "Select Files" button to upload PDFs and images.
2. Reorder files by dragging and dropping them in the desired sequence.
3. Click "Merge Files" to combine the uploaded files into a single PDF.
4. Download the merged PDF once the process is complete.

## File Types Supported

- **PDF files** (`.pdf`)
- **Image files**: 
  - PNG (`.png`)
  - JPEG (`.jpg`, `.jpeg`)
  - GIF (`.gif`)
  - BMP (`.bmp`)
  - TIFF (`.tiff`)

## License

This project is licensed under the AGPL-3.0 license. See the [LICENSE](./LICENSE) file for details.
