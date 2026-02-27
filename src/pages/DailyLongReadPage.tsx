import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Loader2 } from "lucide-react";
import { getDailyContent, DailyContent } from "@/services/supabaseService";

/* ── Lightweight Markdown → JSX renderer ────────────────────────── */

function renderMarkdown(md: string) {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const renderInline = (text: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }
            if (match[2] || match[3]) {
                parts.push(<strong key={`b-${match.index}`} className="font-semibold text-foreground">{match[2] || match[3]}</strong>);
            } else if (match[4] || match[5]) {
                parts.push(<em key={`i-${match.index}`} className="italic">{match[4] || match[5]}</em>);
            } else if (match[6]) {
                parts.push(<code key={`c-${match.index}`} className="px-1.5 py-0.5 rounded-md bg-secondary text-sm font-mono text-primary">{match[6]}</code>);
            } else if (match[7] && match[8]) {
                parts.push(<a key={`a-${match.index}`} href={match[8]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">{match[7]}</a>);
            }
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }
        return parts.length > 0 ? parts : [text];
    };

    while (i < lines.length) {
        const line = lines[i];

        if (line.trim() === '') { i++; continue; }

        // Code block
        if (line.trim().startsWith('```')) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++;
            elements.push(
                <pre key={`code-${i}`} className="p-4 rounded-xl bg-secondary/70 border border-border/30 overflow-x-auto my-3">
                    <code className="text-sm font-mono text-foreground whitespace-pre">{codeLines.join('\n')}</code>
                </pre>
            );
            continue;
        }

        // Headings
        if (line.startsWith('### ')) {
            elements.push(<h3 key={`h3-${i}`} className="text-base font-bold text-foreground mt-6 mb-2">{renderInline(line.slice(4))}</h3>);
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={`h2-${i}`} className="text-lg font-bold text-foreground mt-7 mb-3">{renderInline(line.slice(3))}</h2>);
            i++; continue;
        }
        if (line.startsWith('# ')) {
            elements.push(<h1 key={`h1-${i}`} className="text-xl font-bold text-foreground mt-8 mb-3">{renderInline(line.slice(2))}</h1>);
            i++; continue;
        }

        // Blockquote
        if (line.startsWith('> ')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                quoteLines.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <blockquote key={`bq-${i}`} className="border-l-4 border-primary/40 pl-4 py-2 my-3 text-muted-foreground italic bg-secondary/30 rounded-r-lg">
                    {quoteLines.map((ql, qi) => <p key={qi} className="text-sm leading-relaxed">{renderInline(ql)}</p>)}
                </blockquote>
            );
            continue;
        }

        // Unordered list
        if (line.match(/^[-*]\s/)) {
            const listItems: string[] = [];
            while (i < lines.length && lines[i].match(/^[-*]\s/)) {
                listItems.push(lines[i].replace(/^[-*]\s/, ''));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} className="list-disc list-inside space-y-1.5 my-3 ml-1">
                    {listItems.map((item, li) => <li key={li} className="text-sm text-secondary-foreground leading-relaxed">{renderInline(item)}</li>)}
                </ul>
            );
            continue;
        }

        // Ordered list
        if (line.match(/^\d+\.\s/)) {
            const listItems: string[] = [];
            while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
                listItems.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1.5 my-3 ml-1">
                    {listItems.map((item, li) => <li key={li} className="text-sm text-secondary-foreground leading-relaxed">{renderInline(item)}</li>)}
                </ol>
            );
            continue;
        }

        // Image
        const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
        if (imgMatch) {
            elements.push(
                <figure key={`img-${i}`} className="my-4">
                    <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full rounded-xl object-cover max-h-72" />
                    {imgMatch[1] && <figcaption className="text-xs text-muted-foreground text-center mt-2">{imgMatch[1]}</figcaption>}
                </figure>
            );
            i++; continue;
        }

        // Horizontal rule
        if (line.match(/^---+$/)) {
            elements.push(<hr key={`hr-${i}`} className="my-5 border-border/50" />);
            i++; continue;
        }

        // Paragraph
        elements.push(<p key={`p-${i}`} className="text-sm text-secondary-foreground leading-relaxed my-2">{renderInline(line)}</p>);
        i++;
    }

    return elements;
}

/* ── Daily Long Read Page ───────────────────────────────────────── */

export default function DailyLongReadPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const [content, setContent] = useState<DailyContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getDailyContent(dateParam)
            .then(setContent)
            .catch(() => setContent(null))
            .finally(() => setIsLoading(false));
    }, [dateParam]);

    const longRead = content?.longRead;
    const wordCount = longRead?.body ? longRead.body.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    const renderedBody = useMemo(() => renderMarkdown(longRead?.body || ''), [longRead?.body]);

    const goBack = () => navigate("/daily");

    if (isLoading) {
        return (
            <div className="min-h-[calc(100svh-4rem)] flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!longRead) {
        return (
            <div className="min-h-[calc(100svh-4rem)] flex flex-col items-center justify-center bg-background px-5 text-center">
                <BookOpen size={40} className="text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">No long read found</h2>
                <p className="text-sm text-muted-foreground mb-6">There's no long read available for this date.</p>
                <button
                    onClick={goBack}
                    className="px-6 py-3 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    Back to Daily
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100svh-4rem)] flex flex-col bg-background">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-md">
                <button
                    onClick={goBack}
                    className="p-2 rounded-xl hover:bg-secondary transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} className="text-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{longRead.title}</p>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={12} />
                        <span className="text-xs">{readTime} min read</span>
                    </div>
                </div>
            </div>

            {/* Article content */}
            <div className="flex-1 px-5 pt-5 pb-10">
                {/* Hero image */}
                {longRead.imageUrl && (
                    <div className="mb-5 -mx-1">
                        <img
                            src={longRead.imageUrl}
                            alt={longRead.title}
                            className="w-full rounded-2xl object-cover max-h-56"
                        />
                    </div>
                )}

                {/* Title */}
                <h1 className="text-xl font-bold text-foreground mb-1">{longRead.title}</h1>
                <div className="flex items-center gap-3 mb-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                        Long Read
                    </span>
                    <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} words · {readTime} min</span>
                </div>

                <hr className="border-border/40 mb-5" />

                {/* Rendered markdown body */}
                <article className="prose-sm">
                    {renderedBody}
                </article>

                {/* End of article */}
                <div className="flex items-center justify-center gap-3 mt-8 mb-4">
                    <div className="h-px flex-1 bg-border/50" />
                    <BookOpen size={16} className="text-muted-foreground" />
                    <div className="h-px flex-1 bg-border/50" />
                </div>
                <p className="text-center text-xs text-muted-foreground mb-6">You've reached the end of this article.</p>

                <button
                    onClick={goBack}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Daily</span>
                </button>
            </div>
        </div>
    );
}
