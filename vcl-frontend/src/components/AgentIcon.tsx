import { useState } from 'react'

function agentToFilename(agent: string): string {
  return agent.replace('/', '')
}

interface AgentIconProps {
  agent: string
  size?: number
  className?: string
  tooltip?: string
}

export default function AgentIcon({ agent, size = 18, className = '', tooltip }: AgentIconProps) {
  const [failed, setFailed] = useState(false)
  const filename = agentToFilename(agent)
  const titleText = tooltip ? `${agent} — ${tooltip}` : agent

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-card text-[10px] text-text-muted font-mono ${className}`}
        style={{ width: size, height: size }}
        title={titleText}
      >
        {agent.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      src={`./icons/${filename}.png`}
      alt={agent}
      title={titleText}
      width={size}
      height={size}
      className={`rounded-full inline-block ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
