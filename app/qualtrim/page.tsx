import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Qualtrim",
}

export default function QualtrimEmbedPage() {
  const src = "/qualtrim-proxy/"
  return (
    <div className="w-full" style={{ height: "calc(100vh - 4rem)" }}>
      <iframe
        src={src}
        className="w-full h-full border-0"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}

