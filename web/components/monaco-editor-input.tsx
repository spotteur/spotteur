'use client'

import { Editor, type EditorProps } from '@monaco-editor/react'

interface MonacoEditorInputProps extends Omit<EditorProps, 'width' | 'theme' | 'onChange'> {
  value?: string
  onChange: (value: string | undefined) => void
}

export function MonacoEditorInput({ options, ...props }: MonacoEditorInputProps) {
  const monacoEditorOptions = {
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
    lineNumbersMinChars: 3,
    ...options,
  } satisfies EditorProps['options']

  return <Editor options={monacoEditorOptions} width="100%" theme="vs-dark" {...props} />
}
