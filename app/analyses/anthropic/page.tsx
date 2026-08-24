import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function getEssay() {
  const essayPath = path.join(process.cwd(), 'content', 'anthropic-essay.txt')
  const lines = fs
    .readFileSync(essayPath, 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
  const title = lines[0] ?? ''
  const subtitleLine = lines.slice(1).find(line => line.trim().length > 0) ?? ''
  const firstRule = lines.findIndex(line => line.trim() === '---')
  const bodyStart = firstRule >= 0 ? firstRule + 1 : 1

  return {
    title: title.replace(/^#\s+/, ''),
    subtitle: subtitleLine.replace(/^\*(.*)\*$/, '$1'),
    body: lines.slice(bodyStart).join('\n').trim(),
  }
}

export default function AnthropicEssayPage() {
  const essay = getEssay()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-[#ddd2c7] bg-[#f3eee7] text-[#282421] dark:border-[#35312e] dark:bg-[#171615] dark:text-[#f2eee8]">
        <div className="mx-auto max-w-[52rem] px-4 py-10 sm:px-6 sm:py-16">
          <Link
            href="/analyses"
            className="mb-10 inline-flex items-center text-sm font-medium text-[#746b64] transition-colors hover:text-[#a14f34] dark:text-[#aaa19a] dark:hover:text-[#e09274]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analyses
          </Link>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9dfd5] ring-1 ring-[#d8cabd] dark:bg-[#292522] dark:ring-[#443a34]">
              <img src="/anthropic-logo.svg" alt="Anthropic logo" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a14f34] dark:text-[#e09274]">
                Strategic Essay
              </p>
              <p className="text-sm text-[#746b64] dark:text-[#b8afa8]">Anthropic</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {essay.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg italic leading-7 text-[#655d57] dark:text-[#c7beb7] sm:text-xl">
            {essay.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#746b64] dark:text-[#aaa19a]">
            <span className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              August 25, 2026
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-[#d97757] sm:block" />
            <span>Long-form investment thinking</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[52rem] px-4 py-10 sm:px-6 sm:py-16">
        <article className="[&>p:first-child]:text-xl [&>p:first-child]:leading-9 sm:[&>p:first-child]:text-2xl sm:[&>p:first-child]:leading-10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="mb-6 mt-14 border-t border-[#d8cec5] pt-7 text-2xl font-bold tracking-tight text-[#282421] dark:border-[#35312e] dark:!text-[#f2eee8] sm:mt-16 sm:text-3xl">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-5 mt-10 text-xl font-bold tracking-tight text-[#282421] dark:!text-[#f2eee8] sm:text-2xl">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-6 text-[1.0625rem] leading-8 text-gray-700 sm:text-lg sm:leading-9">
                  {children}
                </p>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target={href?.startsWith('#') ? undefined : '_blank'}
                  rel={href?.startsWith('#') ? undefined : 'noreferrer'}
                  className="inline text-[#a14f34] underline decoration-[#d97757]/50 underline-offset-4 transition-colors hover:text-[#7d3b29] dark:text-[#e09274] dark:hover:text-[#f0ad95]"
                >
                  {children}
                  {!href?.startsWith('#') && (
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5 align-baseline" />
                  )}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">{children}</strong>
              ),
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              ul: ({ children }) => (
                <ul className="mb-8 ml-6 list-disc space-y-3 text-gray-700 marker:text-[#d97757]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-8 ml-6 list-decimal space-y-3 text-gray-700 marker:text-[#d97757]">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="pl-1 text-[1.0625rem] leading-8 sm:text-lg sm:leading-9">
                  {children}
                </li>
              ),
              hr: () => <hr className="my-12 border-[#d8cec5] dark:border-[#35312e]" />,
              sup: ({ children }) => (
                <sup className="ml-0.5 text-xs font-semibold text-[#a14f34] dark:text-[#e09274]">
                  {children}
                </sup>
              ),
            }}
          >
            {essay.body}
          </ReactMarkdown>
        </article>

        <div className="mt-14 border-t border-gray-200 pt-8">
          <Link
            href="/analyses"
            className="inline-flex items-center text-sm font-semibold text-[#a14f34] transition-colors hover:text-[#7d3b29] dark:text-[#e09274] dark:hover:text-[#f0ad95]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analyses
          </Link>
        </div>
      </div>
    </main>
  )
}
