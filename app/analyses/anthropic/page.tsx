import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'

const sectionHeadings = new Set([
  'What Happens If Intelligence Becomes Cheap?',
  'The General Intellect',
  'The Six-Month Question',
  'When Power Starts Producing Power',
  'The Hyperscaler Paradox',
  'Why $2 Trillion Might Be the Wrong Number to Obsess Over',
  'The $2 Trillion Contingent Hedge',
  'Why Not Wait?',
  'The Spacing Guild Outcome',
])

const references = [
  {
    title: 'Anthropic investors target a $2 trillion-plus IPO valuation',
    publisher: 'Fortune, August 14, 2026',
    href: 'https://fortune.com/2026/08/14/anthropic-valuation-ipo-amazon-trillion-openai/',
  },
  {
    title: 'Anthropic races toward a Wall Street debut with a confidential SEC filing',
    publisher: 'Associated Press, June 1, 2026',
    href: 'https://apnews.com/article/572bb6cc12053c7aa95f775285cf4b73',
  },
  {
    title: 'The Long-Term Benefit Trust',
    publisher: 'Anthropic',
    href: 'https://www.anthropic.com/news/the-long-term-benefit-trust',
  },
  {
    title: 'Anthropic Economic Index report: Learning curves',
    publisher: 'Anthropic, March 2026',
    href: 'https://www.anthropic.com/research/economic-index-march-2026-report',
  },
  {
    title: 'The Economics of Recursive Self-Improvement',
    publisher: 'METR, July 22, 2026',
    href: 'https://metr.org/notes/2026-07-22-economics-of-recursive-self-improvement/',
  },
  {
    title: 'Explosive growth from AI automation: A review of the arguments',
    publisher: 'Davidson, 2023',
    href: 'https://arxiv.org/abs/2309.11690',
  },
  {
    title: 'Will Compute Bottlenecks Prevent an Intelligence Explosion?',
    publisher: 'Davidson & Choshen, 2025',
    href: 'https://arxiv.org/abs/2507.23181',
  },
  {
    title: 'Anthropic and Amazon expand collaboration for up to 5 gigawatts of new compute',
    publisher: 'Anthropic, 2026',
    href: 'https://www.anthropic.com/news/anthropic-amazon-compute',
  },
  {
    title: 'Microsoft, NVIDIA, and Anthropic announce strategic partnerships',
    publisher: 'Anthropic, 2025',
    href: 'https://www.anthropic.com/news/microsoft-nvidia-anthropic-announce-strategic-partnerships',
  },
  {
    title: 'The Coal Question',
    publisher: 'William Stanley Jevons, 1865',
    href: 'https://www.econlib.org/library/YPDBooks/Jevons/jvnCQ.html',
  },
  {
    title: 'The Use of Knowledge in Society',
    publisher: 'F. A. Hayek, 1945',
    href: 'https://german.yale.edu/sites/default/files/hayek_-_the_use_of_knowledge_in_society.pdf',
  },
  {
    title: 'Grundrisse: The Fragment on Machines',
    publisher: 'Karl Marx, 1857–58',
    href: 'https://www.marxists.org/archive/marx/works/1857/grundrisse/ch14.htm',
  },
  {
    title: 'The Tacit Dimension',
    publisher: 'Michael Polanyi, University of Chicago Press',
    href: 'https://press.uchicago.edu/ucp/books/book/chicago/T/bo6035368.html',
  },
  {
    title: '7 Powers: The Foundations of Business Strategy',
    publisher: 'Hamilton Helmer',
    href: 'https://7powers.com/',
  },
  {
    title: 'The St. Petersburg Paradox',
    publisher: 'Stanford Encyclopedia of Philosophy',
    href: 'https://plato.stanford.edu/entries/paradox-stpetersburg/',
  },
  {
    title: 'Annual Reports',
    publisher: 'Taiwan Semiconductor Manufacturing Company',
    href: 'https://investor.tsmc.com/english/annual-reports',
  },
  {
    title: 'The Foundation series',
    publisher: 'Isaac Asimov',
  },
  {
    title: 'Dune',
    publisher: 'Frank Herbert',
  },
  {
    title: 'The Culture series',
    publisher: 'Iain M. Banks',
  },
]

function getEssay() {
  const essayPath = path.join(process.cwd(), 'content', 'anthropic-essay.txt')
  const lines = fs.readFileSync(essayPath, 'utf8').trim().split(/\r?\n/)
  const title = lines.shift() ?? ''
  const blocks: string[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(paragraph.join('\n'))
      paragraph = []
    }
  }

  for (const line of lines) {
    if (sectionHeadings.has(line)) {
      flushParagraph()
      blocks.push(line)
    } else if (line.length === 0) {
      flushParagraph()
    } else {
      paragraph.push(line)
    }
  }

  flushParagraph()

  return {
    title,
    blocks,
  }
}

export default function AnthropicEssayPage() {
  const essay = getEssay()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-[#ddd2c7] bg-[#f3eee7] text-[#282421] dark:border-[#35312e] dark:bg-[#171615] dark:text-[#f2eee8]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
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

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {essay.title}
          </h1>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#746b64] dark:text-[#aaa19a]">
            <span className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              August 21, 2026
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-[#d97757] sm:block" />
            <span>Long-form investment thinking</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <article>
          {essay.blocks.map((block, index) =>
            sectionHeadings.has(block) ? (
              <h2
                key={`${block}-${index}`}
                className="mb-6 mt-14 border-t border-[#d8cec5] pt-7 text-2xl font-bold tracking-tight text-gray-950 first:mt-0 dark:border-[#35312e] sm:mt-16 sm:text-3xl"
              >
                {block}
              </h2>
            ) : (
              <p
                key={index}
                className={`mb-6 text-[1.0625rem] leading-8 text-gray-700 sm:text-lg sm:leading-9 ${
                  index === 0 ? 'text-xl leading-9 text-gray-900 sm:text-2xl sm:leading-10' : ''
                }`}
              >
                {block}
              </p>
            )
          )}
        </article>

        <section className="mt-16 border-t border-gray-200 pt-10 sm:mt-20">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a14f34] dark:text-[#e09274]">
              Further reading & referenced works
            </p>
            <h2 className="text-2xl font-bold text-gray-950">References</h2>
          </div>

          <ol className="space-y-4">
            {references.map((reference, index) => (
              <li
                key={`${reference.title}-${reference.publisher}`}
                className="group flex gap-4 text-sm leading-6 text-gray-600 sm:text-base"
              >
                <span className="w-6 shrink-0 font-mono text-xs font-semibold text-[#a14f34] dark:text-[#e09274]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  {reference.href ? (
                    <a
                      href={reference.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-start font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-[#a14f34] hover:decoration-[#d97757] dark:hover:text-[#e09274]"
                    >
                      {reference.title}
                      <ExternalLink className="ml-1.5 mt-1 h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <p className="font-medium text-gray-900">{reference.title}</p>
                  )}
                  <p className="text-gray-500">{reference.publisher}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

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
