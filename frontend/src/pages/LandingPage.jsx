import { Link } from 'react-router-dom'
import { Users, Code2, PenTool, PlayCircle, ArrowUpRight } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'

const FEATURES = [
  {
    icon: Users,
    title: 'Real-Time Collaboration',
    description: 'See who is in the room and chat instantly, so no one is ever coding alone.',
    gradient: 'from-signal-500/20 to-signal-600/5',
    accent: 'text-signal-400',
  },
  {
    icon: Code2,
    title: 'Multi-Language Coding',
    description: 'Edit files together in Monaco — Java, Python, C/C++, JS, PHP — all in real time.',
    gradient: 'from-violet-500/20 to-violet-600/5',
    accent: 'text-violet-400',
  },
  {
    icon: PenTool,
    title: 'Interactive Whiteboard',
    description: 'Sketch a diagram or trace through an algorithm on a shared canvas mid-lesson.',
    gradient: 'from-amber-500/20 to-amber-600/5',
    accent: 'text-amber-400',
  },
  {
    icon: PlayCircle,
    title: 'Code Execution',
    description: 'Run real code in an isolated Docker sandbox with interactive terminal I/O.',
    gradient: 'from-signal-500/20 to-signal-600/5',
    accent: 'text-signal-400',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-12 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-sm font-semibold text-violet-500 mb-5 tracking-wide uppercase">Collaborative Coding Classroom</p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.08] max-w-xl" style={{ color: 'var(--text-primary)' }}>
              Learn. Code.{' '}
              <span className="bg-gradient-to-r from-violet-500 to-signal-500 bg-clip-text text-transparent">
                Collaborate.
              </span>{' '}
              Together.
            </h1>
            <p className="mt-6 text-lg max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A real-time collaborative classroom for interactive programming education — supporting multiple languages.
            </p>
            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                to="/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                Create Classroom
                <ArrowUpRight className="h-4 w-4 hidden sm:inline" />
              </Link>
              <Link
                to="/join"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--surface-card)' }}
              >
                Join Classroom
              </Link>
            </div>
            <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              No sign-up needed — admins get a room code, users join with a name.
            </p>
          </div>

          {/* Editor visual */}
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-violet-600/20 via-transparent to-signal-500/10 blur-2xl rounded-3xl" />
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-card)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-signal-400" />
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Main.java · Room EDU482</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] text-xs">
                <pre className="font-mono text-[13px] leading-6 px-4 py-4 overflow-hidden" style={{ color: 'var(--text-secondary)' }}>
{`public class Main {
  public static void main(String[] a) {
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
      sum += i;
    }
    System.out.println("Sum = " + sum);
  }
}`}
                </pre>
                <div className="px-3 py-4 flex flex-col gap-3 w-32" style={{ borderLeft: '1px solid var(--border-color)' }}>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Participants</p>
                  {['Dr. Sharma', 'Anita', 'Rohit'].map((name, i) => (
                    <div key={name} className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          i === 0 ? 'bg-violet-400' : 'bg-signal-400 animate-pulse-dot'
                        }`}
                      />
                      <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface-secondary)' }}>
                <p className="text-[11px] font-mono text-signal-400">▶ Sum = 15</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {FEATURES.map(({ icon: Icon, title, description, gradient, accent }) => (
            <div
              key={title}
              className={`rounded-xl p-5 bg-gradient-to-br ${gradient} hover:scale-[1.02] transition-all cursor-default`}
              style={{ border: '1px solid var(--border-color)' }}
            >
              <div className={`inline-flex p-2 rounded-lg ${accent} bg-white/10 dark:bg-white/5`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8" style={{ borderTop: '1px solid var(--border-color)' }}>
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>eduSmart — an MCA collaborative-learning project</p>
      </footer>
    </div>
  )
}
