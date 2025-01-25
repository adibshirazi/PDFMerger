"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import ErrorBoundary from "./components/ErrorBoundary"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Upload, FileText, ImageIcon } from "lucide-react"
import FileListItem from "./components/FileListItem"
import { useDropzone } from "react-dropzone"

type FileItem = {
  id: string
  name: string
  file: File
  type: "pdf" | "image"
}

function PDFMerger() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      type: file.type === "application/pdf" ? "pdf" : "image",
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff"],
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        file,
        type: file.type === "application/pdf" ? "pdf" : "image",
      }))
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleChooseFiles = () => {
    fileInputRef.current?.click()
  }

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles]
      const [removed] = newFiles.splice(dragIndex, 1)
      newFiles.splice(hoverIndex, 0, removed)
      return newFiles
    })
  }, [])

  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id))
  }

  const handleMerge = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      const { PDFDocument } = await import("pdf-lib")
      const mergedPdf = await PDFDocument.create()
      const totalFiles = files.length

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i]
        const fileArrayBuffer = await file.file.arrayBuffer()

        if (file.type === "pdf") {
          const pdfDoc = await PDFDocument.load(fileArrayBuffer)
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
          copiedPages.forEach((page) => mergedPdf.addPage(page))
        } else {
          const image = file.file.type.startsWith("image/png")
            ? await mergedPdf.embedPng(fileArrayBuffer)
            : await mergedPdf.embedJpg(fileArrayBuffer)

          const { width, height } = image.scale(1)
          const page = mergedPdf.addPage([width, height])
          page.drawImage(image, {
            x: 0,
            y: 0,
            width,
            height,
          })
        }

        setProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      // Remove all metadata
      mergedPdf.setTitle("")
      mergedPdf.setAuthor("")
      mergedPdf.setSubject("")
      mergedPdf.setKeywords([])
      mergedPdf.setProducer("")
      mergedPdf.setCreator("")
      mergedPdf.setCreationDate(new Date(0))
      mergedPdf.setModificationDate(new Date(0))

      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "merged.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error in merge process:", error)
      setError(error instanceof Error ? error.message : "An error occurred while merging files. Please try again.")
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative"
    >
      <div className="w-full max-w-2xl bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-semibold mb-2 text-center">PDF Merger</h1>
          <p className="text-gray-400 text-sm text-center mb-4">
            Combine PDFs and images into a single document
          </p>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="text-blue-400" size={20} />
              <span className="text-sm font-medium">PDFs: {files.filter((f) => f.type === "pdf").length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ImageIcon className="text-green-400" size={20} />
              <span className="text-sm font-medium">Images: {files.filter((f) => f.type === "image").length}</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-500 bg-opacity-10" : "border-gray-700 hover:border-gray-600"
            }`}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
          </motion.div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.tiff"
            multiple
            className="hidden"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            <Button
              onClick={handleChooseFiles}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-300 ease-in-out flex items-center justify-center mb-4"
            >
              <Upload size={18} className="mr-2" />
              Select Files
            </Button>
          </motion.div>
          <AnimatePresence>
            {files.map((file, index) => (
              <FileListItem
                key={file.id}
                id={file.id}
                name={file.name}
                index={index}
                moveItem={moveItem}
                onRemove={() => removeFile(file.id)}
                type={file.type}
              />
            ))}
          </AnimatePresence>
          {files.length > 0 && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={handleMerge}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition duration-300 ease-in-out"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Merging...
                  </>
                ) : (
                  "Merge Files"
                )}
              </Button>
            </motion.div>
          )}
          {isLoading && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Progress value={progress} className="w-full" />
              <p className="text-center text-sm text-gray-400 mt-2">{progress}% Complete</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              className="mt-4 text-red-500 text-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>
      <motion.div
        className="absolute bottom-2 text-gray-500 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        © {new Date().getFullYear()} ASH. Licensed under the GNU Affero General Public License v3.0.
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <DndProvider backend={HTML5Backend}>
        <PDFMerger />
      </DndProvider>
    </ErrorBoundary>
  )
}

