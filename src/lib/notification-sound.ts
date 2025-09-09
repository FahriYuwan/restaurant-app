export class NotificationSound {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    // Initialize audio context on user interaction
    if (typeof window !== 'undefined') {
      this.setupAudioContext()
    }
  }

  private setupAudioContext() {
    const initAudio = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }

    document.addEventListener('click', initAudio)
    document.addEventListener('touchstart', initAudio)
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext || !this.enabled) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  playNewOrderSound() {
    // Play a pleasant notification sound for new orders
    this.createBeep(800, 0.2, 0.3)
    setTimeout(() => this.createBeep(600, 0.2, 0.3), 150)
    setTimeout(() => this.createBeep(800, 0.3, 0.3), 300)
  }

  playStatusUpdateSound() {
    // Play a single beep for status updates
    this.createBeep(600, 0.3, 0.2)
  }

  playCompletionSound() {
    // Play an ascending sequence for order completion
    this.createBeep(500, 0.15, 0.25)
    setTimeout(() => this.createBeep(600, 0.15, 0.25), 100)
    setTimeout(() => this.createBeep(700, 0.15, 0.25), 200)
    setTimeout(() => this.createBeep(800, 0.3, 0.25), 300)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }
}

export const notificationSound = new NotificationSound()