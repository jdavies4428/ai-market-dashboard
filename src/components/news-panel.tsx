"use client";

import { NewsItem } from "@/lib/types";

interface NewsPanelProps {
  news: NewsItem[];
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return "1d ago";
}

export function NewsPanel({ news }: NewsPanelProps) {
  return (
    <aside className="flex flex-col border-t border-zinc-800 bg-zinc-950 lg:h-full lg:border-l lg:border-t-0">
      <div className="border-b border-zinc-800 px-3 py-2 sm:px-4 sm:py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          News
        </h2>
      </div>
      <div className="lg:flex-1 lg:overflow-y-auto">
        {news.length === 0 ? (
          <p className="px-4 py-6 text-center text-[11px] text-zinc-600">
            No news in the last 24h
          </p>
        ) : (
          <ul>
            {news.map((item, i) => (
              <li
                key={`${item.link}-${i}`}
                className="border-b border-zinc-800/40 px-4 py-3 transition-colors hover:bg-zinc-900/50"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <p className="text-[11px] leading-snug font-medium text-zinc-300 hover:text-zinc-100 transition-colors">
                    {item.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">
                      {timeAgo(item.pubDate)}
                    </span>
                    {item.tickers.length > 0 && (
                      <div className="flex items-center gap-1">
                        {item.tickers.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
