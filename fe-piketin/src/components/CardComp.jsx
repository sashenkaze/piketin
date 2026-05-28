import { Card } from "flowbite-react"

export default function CardComp({ children, className = "" }) {
    return (
        <div className={`rounded-xl shadow-lg overflow-hidden ${className}`}>
            {/* naro isi konten yg make CardComp */}
            {children}
        </div>
    )
}