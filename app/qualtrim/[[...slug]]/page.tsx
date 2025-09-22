import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Qualtrim",
}

type PageParams = {
  params: {
    slug?: string[]
  }
  searchParams: Record<string, string | string[] | undefined>
}

function buildQualtrimUrl(pathSegments: string[] | undefined, searchParams: Record<string, string | string[] | undefined>): string {
  const baseUrl = "https://www.qualtrim.com"
  const path = Array.isArray(pathSegments) && pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "/"

  const entries: Array<[string, string]> = []
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      entries.push([key, value])
    } else if (Array.isArray(value)) {
      for (const v of value) {
        entries.push([key, v])
      }
    }
  }

  const qs = new URLSearchParams(entries).toString()
  return qs ? `${baseUrl}${path}?${qs}` : `${baseUrl}${path}`
}

export default function QualtrimPage({ params, searchParams }: PageParams) {
  const src = buildQualtrimUrl(params.slug, searchParams)

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

