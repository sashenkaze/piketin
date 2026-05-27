import { Card } from "flowbite-react"

export default function CardComp({ children }) {
    return (
        <Card className="max-w-sm">
            {/* naro isi konten yg make CardComp */}
            {children}
        </Card>
    )
}