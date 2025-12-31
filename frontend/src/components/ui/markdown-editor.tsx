import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

function getMarkdown(editor: Editor): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (editor.storage as any).markdown.getMarkdown();
}

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export interface MarkdownEditorRef {
    focus: () => void;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
    ({ value, onChange, placeholder, disabled = false, className }, ref) => {
        const editor = useEditor({
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: placeholder ?? "",
                }),
                Markdown.configure({
                    html: false,
                    transformPastedText: true,
                    transformCopiedText: true,
                }),
            ],
            content: value,
            editable: !disabled,
            onUpdate: ({ editor }) => {
                onChange(getMarkdown(editor));
            },
        });

        // Sync external value changes (e.g., from LLM generation)
        useEffect(() => {
            if (editor && value !== getMarkdown(editor)) {
                editor.commands.setContent(value);
            }
        }, [value, editor]);

        // Sync disabled state
        useEffect(() => {
            if (editor) {
                editor.setEditable(!disabled);
            }
        }, [disabled, editor]);

        // Expose focus method via ref
        useImperativeHandle(
            ref,
            () => ({
                focus: () => {
                    editor?.commands.focus();
                },
            }),
            [editor],
        );

        return (
            <EditorContent
                editor={editor}
                className={cn(
                    "border-input placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-y-auto",
                    "[&_.tiptap]:outline-none [&_.tiptap]:min-h-full [&_.tiptap]:w-full [&_.tiptap]:overflow-wrap-anywhere",
                    "[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none",
                    "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:ml-4",
                    "[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:ml-4",
                    "[&_.tiptap_strong]:font-bold",
                    "[&_.tiptap_em]:italic",
                    disabled && "cursor-not-allowed opacity-50",
                    className,
                )}
            />
        );
    },
);

export { MarkdownEditor };
