import React, { useState, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'

interface Props {
  endpoint: string
  params: string[]
  onRun: (endpoint: string, body: Record<string, string>) => void
  onBack: () => void
  loading: boolean
  result: unknown
  error: string | null
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function ToolRunner({ endpoint, params, onRun, onBack, loading, result, error }: Props) {
  const required = params.filter(p => !p.endsWith('?'))
  const optional = params.filter(p => p.endsWith('?')).map(p => p.slice(0, -1))
  const allFields = [...required, ...optional]

  const [values, setValues] = useState<Record<string, string>>({})
  const [cursor, setCursor] = useState(0)
  const [frame, setFrame] = useState(0)
  const valuesRef = useRef<Record<string, string>>({})

  React.useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 80)
    return () => clearInterval(t)
  }, [loading])

  useInput((_, key) => {
    if (key.escape) onBack()
  })

  function handleChange(field: string, value: string) {
    const next = { ...valuesRef.current, [field]: value }
    valuesRef.current = next
    setValues(next)
  }

  function handleSubmit(field: string) {
    const next = cursor + 1
    if (next >= allFields.length) {
      onRun(endpoint, valuesRef.current)
    } else {
      setCursor(next)
    }
  }

  if (loading) return (
    <Box flexDirection="column" paddingLeft={2}>
      <Text color="#33C3FF" bold>{SPINNER[frame]} Calling <Text color="#1A52FF" bold>{endpoint}</Text> via x402...</Text>
      <Text color="#4B5563">  paying USDC on Base</Text>
    </Box>
  )

  if (result) return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="#34D399" bold>✓ </Text>
        <Text color="#F9FAFB" bold>{endpoint}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="#1B2B52">{'─'.repeat(52)}</Text>
      </Box>
      <Text color="#B8CBE8">{JSON.stringify(result, null, 2)}</Text>
      <Box marginTop={1}>
        <Text color="#1B2B52">{'─'.repeat(52)}</Text>
      </Box>
      <Text color="#4B5563">  esc to go back</Text>
    </Box>
  )

  if (error) return (
    <Box flexDirection="column">
      <Text color="#EF4444" bold>✗ {error}</Text>
      <Text color="#4B5563">  esc to go back</Text>
    </Box>
  )

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="#1A52FF" bold>◆ </Text>
        <Text color="#F9FAFB" bold>{endpoint}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="#1B2B52">{'─'.repeat(52)}</Text>
      </Box>
      {allFields.map((field, i) => (
        <Box key={field} marginBottom={0}>
          <Text color={i === cursor ? '#33C3FF' : '#6B7280'}>
            {i === cursor ? '▶ ' : '  '}
          </Text>
          <Text color={i === cursor ? '#F9FAFB' : '#6B7280'}>
            {field}
          </Text>
          <Text color="#4B5563">
            {required.includes(field) ? ' *' : ' (opt)'}
            {': '}
          </Text>
          {i === cursor ? (
            <TextInput
              value={values[field] ?? ''}
              onChange={v => handleChange(field, v)}
              onSubmit={() => handleSubmit(field)}
            />
          ) : (
            <Text color="#3D5275">{values[field] || '—'}</Text>
          )}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="#1B2B52">{'─'.repeat(52)}</Text>
      </Box>
      <Text color="#7A8FAE">  ↵ confirm field  ·  esc back</Text>
    </Box>
  )
}
