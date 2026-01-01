import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Minus,
    Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getMarkdown(editor: Editor): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (editor.storage as any).markdown.getMarkdown();
}

interface ToolbarProps {
    editor: Editor | null;
    disabled?: boolean;
}

function Toolbar({ editor, disabled }: ToolbarProps) {
    if (!editor) return null;

    return (
        <div className="flex gap-1 border-b border-input px-1 py-1">
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                disabled={disabled}
                className={
                    editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""
                }
                title="Heading 1"
            >
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                disabled={disabled}
                className={
                    editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""
                }
                title="Heading 2"
            >
                <Heading2 className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                disabled={disabled}
                className={
                    editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""
                }
                title="Heading 3"
            >
                <Heading3 className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={disabled}
                className={editor.isActive("bold") ? "bg-accent" : ""}
                title="Bold"
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={disabled}
                className={editor.isActive("italic") ? "bg-accent" : ""}
                title="Italic"
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                disabled={disabled}
                className={editor.isActive("bulletList") ? "bg-accent" : ""}
                title="Bullet List"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                disabled={disabled}
                className={editor.isActive("orderedList") ? "bg-accent" : ""}
                title="Numbered List"
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                disabled={disabled}
                title="Horizontal Rule"
            >
                <Minus className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={disabled}
                className={editor.isActive("code") ? "bg-accent" : ""}
                title="Inline Code"
            >
                <Code className="h-4 w-4" />
            </Button>
        </div>
    );
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
                // Use emitUpdate: false to prevent triggering onUpdate
                editor.commands.setContent(value, { emitUpdate: false });
            }
        }, [value, editor]);

        // Sync disabled state
        useEffect(() => {
            if (editor) {
                // Use emitUpdate: false to prevent triggering onUpdate
                editor.setEditable(!disabled, false);
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
            <div
                className={cn(
                    "border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex flex-col w-full rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px]",
                    disabled && "cursor-not-allowed opacity-50",
                    className,
                )}
            >
                <Toolbar editor={editor} disabled={disabled} />
                <EditorContent
                    editor={editor}
                    className={cn(
                        "flex-1 min-h-64 px-3 py-2 text-base md:text-sm overflow-y-auto",
                        "[&_.tiptap]:outline-none [&_.tiptap]:h-full [&_.tiptap]:w-full [&_.tiptap]:overflow-wrap-anywhere",
                        "[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none",
                        "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:ml-4",
                        "[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:ml-4",
                        "[&_.tiptap_strong]:font-bold",
                        "[&_.tiptap_em]:italic",
                        "[&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-2",
                        "[&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mb-2",
                        "[&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-bold [&_.tiptap_h3]:mb-2",
                        "[&_.tiptap_hr]:border-t [&_.tiptap_hr]:border-input [&_.tiptap_hr]:my-2",
                        "[&_.tiptap_code]:bg-muted [&_.tiptap_code]:px-1 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:rounded [&_.tiptap_code]:font-mono [&_.tiptap_code]:text-sm",
                    )}
                />
            </div>
        );
    },
);

export { MarkdownEditor };
