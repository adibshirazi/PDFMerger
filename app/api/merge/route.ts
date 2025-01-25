import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument, PDFPage } from "pdf-lib"
import sharp from "sharp"

export async function POST(req: NextRequest) {
  try {
    console.log("Starting merge process")
    const formData = await req.formData()
    const pdfDoc = await PDFDocument.create()
    let fileCount = 0

    for (const [key, value] of formData.entries()) {
      if (value instanceof Blob) {
        fileCount++
        const buffer = Buffer.from(await value.arrayBuffer())
        const fileType = value.type
        console.log(`Processing file ${fileCount}: ${key}, type: ${fileType}`)

        try {
          if (fileType.startsWith("image/")) {
            await processImage(pdfDoc, buffer, fileType)
          } else if (fileType === "application/pdf") {
            await processPDF(pdfDoc, buffer, key)
          } else {
            console.warn(`Unsupported file type: ${fileType}`)
          }
        } catch (fileError) {
          console.error(`Error processing file ${key}:`, fileError)
          throw new Error(`Error processing file ${key}: ${fileError.message}`)
        }
      }
    }

    console.log(`Processed ${fileCount} files`)

    if (fileCount === 0) {
      throw new Error("No valid files were provided")
    }

    // Remove metadata
    pdfDoc.setTitle("")
    pdfDoc.setAuthor("")
    pdfDoc.setSubject("")
    pdfDoc.setKeywords([])
    pdfDoc.setProducer("")
    pdfDoc.setCreator("")

    console.log("Saving merged PDF")
    const pdfBytes = await pdfDoc.save()
    console.log("Merge process completed successfully")

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=merged.pdf",
      },
    })
  } catch (error) {
    console.error("Error in merge process:", error)
    return new NextResponse(JSON.stringify({ error: error.message || "An error occurred during the merge process" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

async function processImage(pdfDoc: PDFDocument, buffer: Buffer, fileType: string) {
  let img
  if (fileType === "image/png") {
    img = await pdfDoc.embedPng(buffer)
  } else {
    // Convert to PNG for other image types
    const pngBuffer = await sharp(buffer).png().toBuffer()
    img = await pdfDoc.embedPng(pngBuffer)
  }

  const { width, height } = img.size()
  const page = pdfDoc.addPage([width, height])
  page.drawImage(img, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  })
}

async function processPDF(pdfDoc: PDFDocument, buffer: Buffer, fileName: string) {
  const srcDoc = await PDFDocument.load(buffer)
  const pageIndices = srcDoc.getPageIndices()
  console.log(`PDF ${fileName} has ${pageIndices.length} pages`)

  for (let i = 0; i < pageIndices.length; i++) {
    try {
      const [copiedPage] = await pdfDoc.copyPages(srcDoc, [i])
      if (copiedPage instanceof PDFPage) {
        const { width, height } = copiedPage.getSize()
        console.log(`Copying page ${i + 1} from ${fileName}, size: ${width}x${height}`)
        pdfDoc.addPage(copiedPage)
      } else {
        console.error(`Failed to copy page ${i + 1} from ${fileName}: copiedPage is not a PDFPage`)
      }
    } catch (pageError) {
      console.error(`Error copying page ${i + 1} from ${fileName}:`, pageError)
    }
  }
}

