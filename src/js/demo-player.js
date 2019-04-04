/*
TO DO
- track segments over progress
  - display ticks (when playing)
*/

//https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Cross-browser_audio_basics#HTML5_audio_in_detail
import whenReady from './whenReady'
const demoPlayers = []

class DemoPlayer {
  constructor(playerEl) {
    this._playerEl = playerEl
    const audio = this.audio = playerEl.querySelector('audio')
    audio.parentNode.removeChild(audio)
    const wrapper = playerEl.querySelector('.demo-player__wrapper')
    wrapper.hidden = false
    this._captureTrackInfo()
    this._bind()
    this.currentTrack = 0
    demoPlayers.push(this)
  }

  toggle() {
    const audio = this.audio
    const playing = !(audio.paused || audio.ended)
    audio[playing ? 'pause' : 'play']()
  }

  toggleTrack(index) {
    if (index === this.currentTrack) {
      this.toggle()
    }
    else {
      this.playTrack(index)
    }
  }

  playTrack(trackIX) {
    const track = this._trackList[trackIX]
    const audio = this.audio
    audio.currentTime = track.startTime + .0001 //fudge factor to get around floating point issue
    audio.play()
  }

  setPlayPauseStatus() {
    const audio = this.audio
    const playPause = this._getPlayPauseButton()
    const isPlaying = !(audio.paused || audio.ended)
    playPause.classList[isPlaying ? 'add' : 'remove']('pause')
    playPause.title = [isPlaying ? 'pause' : 'play']
    playPause.setAttribute('aria-label', playPause.title)
  }

  setProgress() {
    this.animationRequest = window.requestAnimationFrame(this.setProgress.bind(this))
    const audio = this.audio
    const progress = this._playerEl.querySelector('.demo-player__progress')
    const progressbar = progress.querySelector('.demo-player__progressbar')
    const valueNow = audio.currentTime
    const pct = audio.ended ? 100 : Math.min(100, 100 * valueNow / this.duration)
    progress.setAttribute('aria-valuenow', valueNow)
    progressbar.style.transform = `translateX(${pct - 100}%)`
    const trackList = this._trackList 
    for(let i=0; i<trackList.length; i++) {
      const trackItem = trackList[i]
      const trackValueNow = valueNow - trackItem.startTime
      const track = trackItem.track
      const trackProgress = track.querySelector('.demo-player__track-progress')
      const trackProgressbar = trackProgress.querySelector('.demo-player__track-progressbar')
      if (!audio.ended && audio.currentTime && valueNow >= trackItem.startTime && valueNow < trackItem.endTime) {
        trackItem.track.classList.add('playing')
        trackItem.track.classList[audio.paused ? 'add' : 'remove']('paused')
        const trackProgressPct = audio.ended ? 100 : Math.min(100, 100 * trackValueNow / trackItem.duration)
        trackProgressbar.style.transform = `translateX(${trackProgressPct - 100}%)`
        trackProgress.setAttribute('aria-valuenow', trackValueNow)
        this.currentTrack = i
      }
      else {
        trackItem.track.classList.remove('playing')
        trackItem.track.classList.remove('paused')
        trackProgress.setAttribute('aria-valuenow', 0)
      }
    }

    if (audio.paused || audio.ended) {
      window.cancelAnimationFrame(this.animationRequest)
      if (audio.ended) {
        this.reset()
      }
    }
  }

  reset() {
    const audio = this.audio
    audio.pause()
    audio.currentTime = 0
    this.currentTrack = 0
    this.setProgress()
  }

  _bind() {
    this._getPlayPauseButton().addEventListener('click', this.toggle.bind(this))
    if (isNaN(this.audio)) {
      this.audio.addEventListener('durationchange', () => this.duration = this.audio.duration)
    } else {
      this.duration = this.audio.duration
    }
    this.audio.addEventListener('play', () => {
      demoPlayers.forEach(player => {
        if (player !== this) {
          player.reset();
        }
      })
    })
    this.audio.addEventListener('play', this.setProgress.bind(this))
    const onPlayPause = this.setPlayPauseStatus.bind(this)
    this.audio.addEventListener('play', onPlayPause)
    this.audio.addEventListener('pause', onPlayPause)
    this.audio.addEventListener('ended', onPlayPause)

  }

  _getPlayPauseButton() {
    return this._playerEl.querySelector('.demo-player__play-pause')
  }

  _getShowTracksButton() {
    return this._playerEl.querySelector('.demo-player__show-tracks')
  }

  _captureTrackInfo() {
    const tracks = this._playerEl.querySelectorAll('.demo-player__track')
    const trackList = this._trackList = []
    var startTime = 0
    this.duration = 0
    for(let i=0; i< tracks.length; i++) {
      const duration = tracks[i].getAttribute('data-duration') * 1
      const endTime = startTime + duration
      trackList.push({
        track: tracks[i],
        startTime,
        endTime,
        duration,
        audio: tracks[i].getAttribute('data-audio')
      })
      startTime = endTime
      this.duration += duration

      tracks[i].addEventListener('click', ()=> {
        this.toggleTrack(i)
      })

    }
    const progressTicks = this._playerEl.querySelector('.demo-player__progress-ticks')
    progressTicks.innerHTML = renderPlayerTicks(this.duration, trackList)
    const ticks = progressTicks.querySelectorAll('.demo-player__progress-tick')
    for(let i=0; i< ticks.length; i++) {
      ticks[i].addEventListener('click', ()=> {
        this.toggleTrack(i)
      })
    }
  }  
}

function renderPlayerTicks (duration, trackList) {
  let remainingDuration = duration
  let remainingPct = 100
  return trackList.map((trackItem, i) => {
    const pct = remainingPct * trackItem.duration / remainingDuration
    remainingDuration -= trackItem.duration
    remainingPct -= pct
    return `<span class="demo-player__progress-tick" style="width:${pct}%;" title="Jump to read ${i+1}"></span>`
  }).join('')
}

if (typeof Audio === 'function') {
  whenReady(() => {
    const players = document.querySelectorAll('.demo-player')
    for (let i = 0; i < players.length; i++) {
      new DemoPlayer(players[i])
    }
  })
}
