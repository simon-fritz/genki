import { useEditor, EditorContent} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown.configure({
                html: false,
            }),
        ],
        content: content,
        editable: false,
        editorProps: {
            attributes: {
                class: "prose prose-sm max-w-none focus:outline-none",
            },
        },
    });

    // Update content when it changes
    useEffect(() => {
        if (editor && content !== undefined) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={cn("markdown-viewer", className)}>
            <EditorContent editor={editor} />
        </div>
    );
}
