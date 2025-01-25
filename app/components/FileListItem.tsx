"use client"

import { useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import { motion } from "framer-motion"
import { FileIcon, ImageIcon, GripVertical, Trash2 } from "lucide-react"

type FileListItemProps = {
  id: string
  name: string
  index: number
  type: "pdf" | "image"
  moveItem: (dragIndex: number, hoverIndex: number) => void
  onRemove: () => void
}

const FileListItem = ({ id, name, index, type, moveItem, onRemove }: FileListItemProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop({
    accept: "file",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      moveItem(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: "file",
    item: () => {
      return { id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  return (
    <motion.div
      ref={ref}
      className={`flex items-center p-2 mb-2 rounded ${
        isDragging ? "opacity-50" : ""
      } bg-gray-800 transition-all duration-200 ease-in-out`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      data-handler-id={handlerId}
    >
      <GripVertical className="mr-2 text-gray-400 cursor-move" size={16} />
      {type === "pdf" ? (
        <FileIcon className="mr-2 text-blue-400" size={16} />
      ) : (
        <ImageIcon className="mr-2 text-green-400" size={16} />
      )}
      <span className="flex-grow truncate text-sm">{name}</span>
      <button onClick={onRemove} className="ml-2 text-gray-400 hover:text-red-500 transition-colors duration-200">
        <Trash2 size={16} />
      </button>
    </motion.div>
  )
}

export default FileListItem

