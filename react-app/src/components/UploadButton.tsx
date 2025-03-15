import axios from "axios";
import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export const UploadSlides = ()=>{

    const fileInputRef = useRef<HTMLInputElement>(null)

    

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            axios.post("http://localhost:3000/api/v1/file/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
            }).then((res)=>{
                console.log(res.data)
            }).catch((err)=>{
                console.log(err)
            })
          
        }
      }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                // accept=".pdf, .ppt, .pptx, .doc, .docx"
                accept=".pdf"
                className="hidden"
            />

            <button
                onClick={handleClick}
                className={`px-4 py-2 rounded ${
                  true ? 'bg-blue-600' : 'bg-zinc-700'
                } text-white`}
            >
                <Upload className="mr-2 h-4 w-4" /> Upload Slides
            </button>
        </div>
    )
}