import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion'

// ─── design tokens (official BlueAgent design system) ──────────────────────
const BG      = '#060C18'
const SURFACE = '#0A1628'
const CARD    = '#0F1C35'
const MID     = '#162040'
const HIGH    = '#1B2B52'

const BLUE    = '#1A52FF'   // brand blue 500 (cobalt)
const BLUE_LT = '#4A7AFF'   // brand blue 400
const CYAN    = '#33C3FF'   // cyan accent 400 (primary)
const CYAN_LT = '#67C5FF'   // cyan accent 300

const WHITE   = '#FFFFFF'
const TEXT2   = '#B8CBE8'   // secondary text
const TEXT3   = '#7A8FAE'   // muted text
const TEXT4   = '#3D5275'   // subtle text

const SUCCESS = '#22C55E'
const WARNING = '#F59E0B'
const DANGER  = '#EF4444'
const INFO    = '#33C3FF'

const MONO = '"SF Mono", "Fira Code", "Cascadia Code", monospace'
const SANS = 'system-ui, -apple-system, sans-serif'

// ─── helpers ───────────────────────────────────────────────────────────────
function glowBlue(intensity = 1): React.CSSProperties {
  return { textShadow: `0 0 ${20 * intensity}px rgba(26,82,255,${0.6 * intensity}), 0 0 ${40 * intensity}px rgba(26,82,255,${0.3 * intensity})` }
}
function glowCyan(intensity = 1): React.CSSProperties {
  return { textShadow: `0 0 ${24 * intensity}px rgba(51,195,255,${0.6 * intensity}), 0 0 ${48 * intensity}px rgba(51,195,255,${0.3 * intensity})` }
}
function glowSuccess(intensity = 1): React.CSSProperties {
  return { textShadow: `0 0 16px rgba(34,197,94,${0.5 * intensity})` }
}

function fadeIn(frame: number, start: number, dur = 12) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
}

function fadeUp(frame: number, start: number, dur = 15): React.CSSProperties {
  return {
    opacity: interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    transform: `translateY(${interpolate(frame, [start, start + dur], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
  }
}

// ─── scanlines ─────────────────────────────────────────────────────────────
function Scanlines({ frame }: { frame: number }) {
  return (
    <AbsoluteFill style={{
      pointerEvents: 'none', zIndex: 100,
      background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)`,
      backgroundPositionY: (frame * 2) % 4,
    }} />
  )
}

// ─── vignette ──────────────────────────────────────────────────────────────
function Vignette() {
  return (
    <AbsoluteFill style={{
      pointerEvents: 'none', zIndex: 99,
      background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)',
    }} />
  )
}

// ─── background mesh gradient ──────────────────────────────────────────────
function MeshBG({ frame }: { frame: number }) {
  const t = frame / 900
  return (
    <AbsoluteFill style={{
      background: `
        radial-gradient(ellipse 60% 50% at ${30 + t * 20}% 40%, rgba(26,82,255,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 40% 40% at ${70 - t * 15}% 60%, rgba(51,195,255,0.08) 0%, transparent 70%),
        ${BG}
      `,
    }} />
  )
}

// ─── glitch flash ──────────────────────────────────────────────────────────
function GlitchOverlay({ frame, peaks }: { frame: number; peaks: number[] }) {
  const nearest = peaks.reduce((a, b) => Math.abs(b - frame) < Math.abs(a - frame) ? b : a)
  const dist = Math.abs(frame - nearest)
  if (dist > 6) return null
  const intensity = interpolate(dist, [0, 6], [1, 0], { extrapolateRight: 'clamp' })
  const jitter = Math.round(Math.sin(frame * 11.3) * 4 * intensity)
  return (
    <AbsoluteFill style={{
      pointerEvents: 'none', zIndex: 101,
      transform: `translateX(${jitter}px)`,
      background: `rgba(26,82,255,${0.06 * intensity})`,
    }} />
  )
}

// ─── terminal top bar ──────────────────────────────────────────────────────
function TerminalBar({ frame }: { frame: number }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 44,
      background: SURFACE,
      borderBottom: `1px solid rgba(26,82,255,0.2)`,
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 8,
      opacity: fadeIn(frame, 0, 20), zIndex: 50,
    }}>
      <div style={{ width: 13, height: 13, borderRadius: '50%', background: DANGER }} />
      <div style={{ width: 13, height: 13, borderRadius: '50%', background: WARNING }} />
      <div style={{ width: 13, height: 13, borderRadius: '50%', background: SUCCESS }} />
      <span style={{ marginLeft: 20, fontFamily: MONO, fontSize: 14, color: TEXT3 }}>blueagent — security os</span>
      <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 13, color: CYAN }}>v1.0.0</span>
    </div>
  )
}

// ─── Scene 1 (0–150f · 0–5s): INTRO ───────────────────────────────────────
function Scene1({ frame }: { frame: number }) {
  const logoScale = spring({ frame, fps: 30, config: { damping: 14, stiffness: 100 } })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      {/* badge */}
      <div style={{
        opacity: fadeIn(frame, 38),
        padding: '7px 22px', borderRadius: 999,
        border: `1px solid rgba(51,195,255,0.3)`,
        background: `rgba(51,195,255,0.06)`,
        fontFamily: MONO, fontSize: 17, color: CYAN, letterSpacing: 2,
      }}>
        ◉ &nbsp; Built on Base · powered by x402
      </div>

      {/* logo — cobalt → cyan gradient */}
      <div style={{ transform: `scale(${logoScale})`, opacity: Math.min(1, logoScale * 2), textAlign: 'center', lineHeight: 0.9 }}>
        <div style={{
          fontSize: 168, fontWeight: 900, fontFamily: SANS, letterSpacing: -6,
          background: `linear-gradient(135deg, ${BLUE} 0%, ${CYAN} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(26,82,255,0.5))',
        }}>
          BLUE
        </div>
        <div style={{
          fontSize: 168, fontWeight: 900, fontFamily: SANS, letterSpacing: -6,
          background: `linear-gradient(135deg, ${CYAN} 0%, ${BLUE_LT} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(51,195,255,0.4))',
        }}>
          AGENT
        </div>
      </div>

      {/* tagline */}
      <div style={{ opacity: fadeIn(frame, 55, 18), fontFamily: MONO, fontSize: 23, color: TEXT2, letterSpacing: 5, textAlign: 'center' }}>
        SECURITY OS FOR AUTONOMOUS AGENTS
      </div>

      {/* live */}
      <div style={{ opacity: fadeIn(frame, 72, 15), fontFamily: MONO, fontSize: 16, color: SUCCESS, letterSpacing: 3, ...glowSuccess(0.8) }}>
        ▶ &nbsp; v1.0 · NOW LIVE ON BASE
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 2 (150–360f · 5–12s): PROBLEM ──────────────────────────────────
function Scene2({ frame }: { frame: number }) {
  const f = frame - 150
  const items = [
    'Honeypot tokens drain your funds',
    'MEV bots sandwich every swap',
    'Unlimited approvals = total exposure',
    'No circuit breaker on losses',
  ]
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 32, padding: '80px 160px' }}>
      <div style={{ ...fadeUp(f, 0), fontFamily: MONO, fontSize: 18, color: TEXT3, letterSpacing: 4, textAlign: 'center' }}>
        WITHOUT A SECURITY LAYER:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 920 }}>
        {items.map((text, i) => (
          <div key={text} style={{
            ...fadeUp(f, 18 + i * 26),
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '18px 28px',
            background: `rgba(239,68,68,0.06)`,
            border: `1px solid rgba(239,68,68,0.2)`,
            borderLeft: `3px solid ${DANGER}`,
            borderRadius: '0 8px 8px 0',
          }}>
            <span style={{ fontFamily: MONO, fontSize: 18, color: DANGER, flexShrink: 0 }}>→</span>
            <span style={{ fontFamily: MONO, fontSize: 27, color: DANGER }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 3 (360–540f · 12–18s): TOOLS ───────────────────────────────────
function Scene3({ frame }: { frame: number }) {
  const f = frame - 360
  const tools = [
    { name: 'honeypot_check',    price: '$0.05', color: CYAN },
    { name: 'rug_pull_risk',     price: '$0.10', color: CYAN },
    { name: 'approval_guard',    price: '$0.05', color: BLUE_LT },
    { name: 'mev_exposure',      price: '$0.10', color: BLUE_LT },
    { name: 'circuit_breaker',   price: '$0.25', color: SUCCESS },
    { name: 'wallet_risk_score', price: '$0.15', color: SUCCESS },
  ]
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 28, padding: '80px 160px' }}>
      <div style={{ ...fadeUp(f, 0), textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 16, color: TEXT3, letterSpacing: 4, marginBottom: 6 }}>NOW SHIPPING</div>
        <div style={{
          fontSize: 108, fontWeight: 900, fontFamily: SANS, lineHeight: 1,
          background: `linear-gradient(135deg, ${BLUE} 0%, ${CYAN} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 24px rgba(26,82,255,0.5))',
        }}>31</div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: TEXT2, letterSpacing: 3 }}>SECURITY TOOLS</div>
      </div>

      <div style={{ width: '100%', maxWidth: 820 }}>
        {tools.map((t, i) => (
          <div key={t.name} style={{
            ...fadeUp(f, 28 + i * 15),
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '13px 6px',
            borderBottom: `1px solid ${HIGH}`,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 24, color: t.color }}>{t.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 20, color: SUCCESS }}>{t.price} / call</span>
          </div>
        ))}
        <div style={{ ...fadeUp(f, 130), textAlign: 'right', fontFamily: MONO, fontSize: 14, color: TEXT4, marginTop: 10 }}>
          + 25 more across Security · Research · Data · Earn
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 4 (540–690f · 18–23s): x402 ────────────────────────────────────
function Scene4({ frame }: { frame: number }) {
  const f = frame - 540
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40, padding: '80px 160px' }}>
      <div style={{
        ...fadeUp(f, 0),
        fontFamily: MONO, fontWeight: 900, fontSize: 50, lineHeight: 1.25, textAlign: 'center',
      }}>
        <span style={{ color: WHITE }}>NO API KEY.<br /></span>
        <span style={{
          background: `linear-gradient(135deg, ${BLUE} 0%, ${CYAN} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          NO SUBSCRIPTION.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 720 }}>
        {[
          { text: 'Pay USDC per call.', color: SUCCESS },
          { text: 'Settled on Base via x402.', color: SUCCESS },
          { text: 'Each call signed by your wallet.', color: TEXT2 },
          { text: 'Nothing to rotate. Nothing to steal.', color: TEXT3 },
        ].map((item, i) => (
          <div key={i} style={{ ...fadeUp(f, 22 + i * 18), fontFamily: MONO, fontSize: 25, color: item.color, textAlign: 'center' }}>
            {item.text}
          </div>
        ))}
      </div>

      <div style={{ ...fadeUp(f, 105), display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{
          padding: '12px 28px', borderRadius: 8,
          background: `rgba(239,68,68,0.08)`, border: `1px solid rgba(239,68,68,0.25)`,
          fontFamily: MONO, fontSize: 18, color: DANGER,
        }}>
          API key &nbsp;→ leaked
        </div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: TEXT3 }}>vs</div>
        <div style={{
          padding: '12px 28px', borderRadius: 8,
          background: `rgba(34,197,94,0.08)`, border: `1px solid rgba(34,197,94,0.25)`,
          fontFamily: MONO, fontSize: 18, color: SUCCESS,
        }}>
          x402 &nbsp;→ wallet signature
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 5 (690–810f · 23–27s): STATS ───────────────────────────────────
function Scene5({ frame }: { frame: number }) {
  const f = frame - 690
  const stats = [
    { value: '31',     label: 'TOOLS',      color: BLUE },
    { value: '$0.05',  label: 'MIN / CALL', color: CYAN },
    { value: '<200ms', label: 'LATENCY',    color: SUCCESS },
  ]
  const cats = [
    { label: 'Security', color: DANGER },
    { label: 'Research', color: BLUE_LT },
    { label: 'Data',     color: SUCCESS },
    { label: 'Earn',     color: WARNING },
  ]
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 52, padding: '80px 100px' }}>
      <div style={{ ...fadeUp(f, 0), fontFamily: MONO, fontSize: 17, color: TEXT3, letterSpacing: 4 }}>NOW LIVE ON BASE</div>

      <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ ...fadeUp(f, 14 + i * 18), textAlign: 'center' }}>
            <div style={{
              fontSize: 88, fontWeight: 900, fontFamily: SANS, lineHeight: 1,
              background: i === 0
                ? `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_LT} 100%)`
                : i === 1
                  ? `linear-gradient(135deg, ${CYAN} 0%, ${CYAN_LT} 100%)`
                  : `${SUCCESS}`,
              WebkitBackgroundClip: i < 2 ? 'text' : undefined,
              WebkitTextFillColor: i < 2 ? 'transparent' : undefined,
              color: i === 2 ? SUCCESS : undefined,
              ...(i === 2 ? glowSuccess(0.8) : {}),
              filter: i < 2 ? `drop-shadow(0 0 20px ${i === 0 ? 'rgba(26,82,255,0.4)' : 'rgba(51,195,255,0.3)'})` : undefined,
            }}>
              {s.value}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, color: TEXT3, letterSpacing: 3, marginTop: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...fadeUp(f, 75), display: 'flex', gap: 14 }}>
        {cats.map(c => (
          <div key={c.label} style={{
            padding: '10px 24px', borderRadius: 6,
            border: `1px solid ${c.color}44`, background: `${c.color}0D`,
            fontFamily: MONO, fontSize: 17, color: c.color,
          }}>
            {c.label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 6 (810–900f · 27–30s): CTA ─────────────────────────────────────
function Scene6({ frame }: { frame: number }) {
  const f = frame - 810
  const logoScale = spring({ frame: f, fps: 30, config: { damping: 13, stiffness: 110 } })
  const cursor = frame % 28 < 18 ? '█' : ' '
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 36, padding: '80px 160px' }}>
      {/* gradient logo */}
      <div style={{ transform: `scale(${logoScale})`, opacity: Math.min(1, logoScale), textAlign: 'center', lineHeight: 0.9 }}>
        <span style={{
          fontSize: 92, fontWeight: 900, fontFamily: SANS, letterSpacing: -3,
          background: `linear-gradient(135deg, ${BLUE} 0%, ${CYAN} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 28px rgba(26,82,255,0.5))',
        }}>
          BLUE
        </span>
        <span style={{
          fontSize: 92, fontWeight: 900, fontFamily: SANS, letterSpacing: -3,
          background: `linear-gradient(135deg, ${CYAN} 0%, ${BLUE_LT} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 28px rgba(51,195,255,0.4))',
        }}>
          AGENT
        </span>
      </div>

      <div style={{ ...fadeUp(f, 14), fontFamily: MONO, fontSize: 24, color: TEXT2, textAlign: 'center' }}>
        Your agent. &nbsp;
        <span style={{
          background: `linear-gradient(135deg, ${BLUE} 0%, ${CYAN} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Protected.
        </span>
      </div>

      {/* install command */}
      <div style={{
        ...fadeUp(f, 28),
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '22px 44px', borderRadius: 12,
        background: CARD, border: `1px solid rgba(51,195,255,0.25)`,
        fontFamily: MONO, fontSize: 26, color: CYAN,
        boxShadow: '0 0 24px rgba(51,195,255,0.12)',
      }}>
        <span style={{ color: TEXT3 }}>$</span>
        <span>npx @blueagent/skill install --claude</span>
        <span style={{ color: CYAN }}>{cursor}</span>
      </div>

      <div style={{ ...fadeUp(f, 50), textAlign: 'center', fontFamily: MONO, fontSize: 15, color: TEXT3, lineHeight: 2 }}>
        Works with Claude Code · AgentKit · Any MCP host<br />
        <span style={{ color: INFO }}>github.com/madebyshun/blueagent-x402-services</span>
      </div>
    </AbsoluteFill>
  )
}

// ─── main ──────────────────────────────────────────────────────────────────
export function X402Intro() {
  const frame = useCurrentFrame()
  const GLITCH = [150, 360, 540, 690, 810]

  function op(start: number, end: number) {
    return interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    })
  }

  return (
    <AbsoluteFill style={{ background: BG }}>
      <MeshBG frame={frame} />
      <Scanlines frame={frame} />
      <Vignette />
      <GlitchOverlay frame={frame} peaks={GLITCH} />
      <TerminalBar frame={frame} />

      {frame < 155 && <div style={{ opacity: op(0, 150) }}><Scene1 frame={frame} /></div>}
      {frame >= 145 && frame < 365 && <div style={{ opacity: op(150, 360) }}><Scene2 frame={frame} /></div>}
      {frame >= 355 && frame < 545 && <div style={{ opacity: op(360, 540) }}><Scene3 frame={frame} /></div>}
      {frame >= 535 && frame < 695 && <div style={{ opacity: op(540, 690) }}><Scene4 frame={frame} /></div>}
      {frame >= 685 && frame < 815 && <div style={{ opacity: op(690, 810) }}><Scene5 frame={frame} /></div>}
      {frame >= 805 && <div style={{ opacity: op(810, 900) }}><Scene6 frame={frame} /></div>}
    </AbsoluteFill>
  )
}
