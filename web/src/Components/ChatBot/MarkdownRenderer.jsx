import React from "react";

/**
 * Lightweight Markdown renderer for chat messages.
 * Supports: bold, italic, code, headings, links, lists, tables, blockquotes, line breaks.
 */

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return text.replace(/[&<>"']/g, (c) => map[c]);
}

// Parse inline formatting (bold, italic, code, links) on already-escaped text
function parseInline(text) {
    // Inline code (must be before bold/italic to avoid conflicts)
    text = text.replace(/`([^`\n]+)`/g, '<code class="bg-gray-600 text-pink-300 px-1 py-0.5 rounded text-xs">$1</code>');

    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300">$1</a>');

    return text;
}

export default function MarkdownRenderer({ content }) {
    if (!content) return null;

    const lines = content.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Empty line
        if (line.trim() === "") {
            elements.push(<br key={i} />);
            i++;
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            const quoteLines = [];
            while (i < lines.length && lines[i].startsWith("> ")) {
                quoteLines.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <blockquote key={i} className="border-l-4 border-blue-400 pl-3 py-1 my-1 text-gray-300 italic">
                    {quoteLines.map((ql, qi) => (
                        <span key={qi}>
                            {qi > 0 && <br />}
                            <span dangerouslySetInnerHTML={{ __html: parseInline(escapeHtml(ql)) }} />
                        </span>
                    ))}
                </blockquote>
            );
            continue;
        }

        // Heading
        if (/^#{1,6}\s/.test(line)) {
            const level = line.match(/^(#{1,6})\s/)[1].length;
            const text = line.replace(/^#{1,6}\s/, "");
            const sizeClass = ["text-lg", "text-base", "text-sm", "text-xs", "text-xs", "text-xs"][level - 1];
            elements.push(
                <div key={i} className={`font-bold ${sizeClass} text-white mt-2 mb-1`}>
                    <span dangerouslySetInnerHTML={{ __html: parseInline(escapeHtml(text)) }} />
                </div>
            );
            i++;
            continue;
        }

        // Table
        if (line.startsWith("|") && line.endsWith("|")) {
            const tableRows = [];
            while (i < lines.length && lines[i].startsWith("|") && lines[i].endsWith("|")) {
                const row = lines[i];
                // Skip separator rows (|---|---|)
                if (!/^\|[\s\-:|]+\|$/.test(row)) {
                    const cells = row.split("|").filter((c) => c.trim() !== "");
                    tableRows.push(cells);
                }
                i++;
            }

            if (tableRows.length > 0) {
                const header = tableRows[0];
                const body = tableRows.slice(1);
                elements.push(
                    <div key={i} className="overflow-x-auto my-2">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-500">
                                    {header.map((cell, ci) => (
                                        <th key={ci} className="px-2 py-1 text-left text-gray-300 font-medium">
                                            <span dangerouslySetInnerHTML={{ __html: parseInline(escapeHtml(cell.trim())) }} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {body.map((row, ri) => (
                                    <tr key={ri} className="border-b border-gray-600">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-2 py-1">
                                                <span dangerouslySetInnerHTML={{ __html: parseInline(escapeHtml(cell.trim())) }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            continue;
        }

        // Unordered list
        if (/^\s*[-*+]\s/.test(line)) {
            const listItems = [];
            while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) {
                listItems.push(lines[i].replace(/^\s*[-*+]\s/, ""));
                i++;
            }
            elements.push(
                <ul key={i} className="list-disc list-inside space-y-0.5 my-1">
                    {listItems.map((item, li) => (
                        <li key={li} className="text-sm">
                            <span dangerouslySetInnerHTML={{ __html: parseInline(escapeHtml(item)) }} />
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Ordered list
        if (/^\s*\d+\.\s/.test(line)) {
            const listItems = [];
            while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
                listItems.push(lines[i].replace(/^\s*\d+\.\s/, ""));
                i++;
            }
            elements.push(
                <ol key={i} className="list-decimal list-inside space-y-0.5 my-1">
                    {listItems.map((item, li) => (
                        <li key={li} className="text-sm">
                            <span dangerouslySetInnerHTML={{ __html: parseInline(escapeHtml(item)) }} />
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Horizontal rule
        if (/^[-*_]{3,}\s*$/.test(line)) {
            elements.push(<hr key={i} className="border-gray-500 my-2" />);
            i++;
            continue;
        }

        // Regular paragraph
        elements.push(
            <p key={i} className="text-sm leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: parseInline(escapeHtml(line)) }} />
            </p>
        );
        i++;
    }

    return <div className="markdown-content">{elements}</div>;
}
