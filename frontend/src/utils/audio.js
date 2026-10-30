export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    
    // Helper for a bell-like marimba tone
    const playChime = (freq, time, duration) => {
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      osc2.type = 'triangle' // Adds harmonic richness
      
      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      
      osc.frequency.setValueAtTime(freq, time)
      osc2.frequency.setValueAtTime(freq * 2, time) // 1 octave up
      
      // Marimba envelope: instant hit, quick exponential decay
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.15, time + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
      
      osc.start(time)
      osc2.start(time)
      osc.stop(time + duration)
      osc2.stop(time + duration)
    }

    const now = ctx.currentTime
    // Classic double chime interval (approx E6 to C#6)
    playChime(1318.51, now, 0.4)
    playChime(1108.73, now + 0.15, 0.5)
    
  } catch (err) {
    console.warn('Audio play failed:', err)
  }
}
