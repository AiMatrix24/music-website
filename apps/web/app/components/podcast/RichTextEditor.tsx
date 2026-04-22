'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';

const COMMON_EMOJIS = ['🎙️', '🎵', '🎶', '🔥', '✨', '💡', '🚀', '❤️', '👋', '😂', '🤔', '🎉', '👀', '💯', '🙏', '👇'];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 120,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank', class: 'text-brand-400 underline' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write something…' }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Treat empty paragraph as empty string so the form sees no content
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none px-4 py-3 text-white',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  // Sync external value changes (e.g. when entering edit mode with existing content)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) {
    return <div className="rounded-xl bg-brand-950 border border-brand-800/30 px-4 py-3 text-gray-500 text-sm" style={{ minHeight }}>Loading editor…</div>;
  }

  const insertLink = () => {
    const url = window.prompt('URL', editor.getAttributes('link').href ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertEmoji = (e: string) => {
    editor.chain().focus().insertContent(e).run();
    setEmojiOpen(false);
  };

  return (
    <div className="rounded-xl bg-brand-950 border border-brand-800/30 overflow-hidden focus-within:border-brand-500 transition">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-brand-800/30 bg-[#0e0e15]">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading"
        >
          H
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          ❝
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={insertLink} active={editor.isActive('link')} title="Add link">
          🔗
        </ToolbarButton>

        <div className="relative">
          <ToolbarButton onClick={() => setEmojiOpen((v) => !v)} active={emojiOpen} title="Emoji">
            😊
          </ToolbarButton>
          {emojiOpen && (
            <div className="absolute z-10 top-full left-0 mt-1 p-2 rounded-xl bg-[#15151f] border border-brand-800/40 shadow-2xl grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insertEmoji(e)}
                  className="text-lg w-8 h-8 rounded hover:bg-brand-700/40 transition"
                >
                  {e}
                </button>
              ))}
              <p className="col-span-8 text-xs text-gray-500 px-1 pt-1 border-t border-brand-800/30 mt-1">
                Tip: Win+. or Ctrl+Cmd+Space for full picker
              </p>
            </div>
          )}
        </div>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          ↷
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`min-w-[28px] h-7 px-2 text-xs rounded transition ${
        active ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-brand-800/40 hover:text-white'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-brand-800/40 mx-1" />;
}
