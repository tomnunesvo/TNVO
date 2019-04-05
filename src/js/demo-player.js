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
    const { audio, _playerEl } = this
    const playPause = this._getPlayPauseButton()
    const audioState = audio.ended || (audio.paused && audio.currentTime === 0) ? 'not-playing' : audio.paused ? 'paused' : 'playing'
    const isPlaying = audioState === 'playing'
    const isPaused = audioState === 'paused'
    _playerEl.classList[isPlaying ? 'add' : 'remove']('playing')
    _playerEl.classList[isPaused ? 'add' : 'remove']('paused')
    playPause.title = [isPlaying ? 'pause' : 'play']
    playPause.setAttribute('aria-label', playPause.title)
  }

  setProgress() {
    this.animationRequest = window.requestAnimationFrame(this.setProgress.bind(this))
    const { _playerEl, audio, _trackList } = this
    const progress = _playerEl.querySelector('.demo-player__progress')
    const progressbar = progress.querySelector('.demo-player__progressbar')
    const valueNow = audio.currentTime
    const pct = audio.ended ? 100 : Math.min(100, 100 * valueNow / this.duration)
    progress.setAttribute('aria-valuenow', valueNow)
    progressbar.style.transform = `translateX(${pct - 100}%)`
    let nowPlayingText = ''
    for(let i=0; i<_trackList.length; i++) {
      const trackItem = _trackList[i]
      const trackValueNow = valueNow - trackItem.startTime
      const track = trackItem.track
      const trackProgress = track.querySelector('.demo-player__track-progress')
      const trackProgressbar = trackProgress.querySelector('.demo-player__track-progressbar')
      if (!audio.ended && audio.currentTime && valueNow >= trackItem.startTime && valueNow < trackItem.endTime) {
        trackItem.track.classList[audio.paused ? 'remove' : 'add']('playing')
        trackItem.track.classList[audio.paused ? 'add' : 'remove']('paused')
        const trackProgressPct = audio.ended ? 100 : Math.min(100, 100 * trackValueNow / trackItem.duration)
        trackProgressbar.style.transform = `translateX(${trackProgressPct - 100}%)`
        trackProgress.setAttribute('aria-valuenow', trackValueNow)
        const currentTrack = this.currentTrack
        if (_trackList[currentTrack] && _trackList[currentTrack].track === document.activeElement )  {
          track.focus()
        }
        this.currentTrack = i
        nowPlayingText = `Now playing read ${i+1}: ${trackItem.track.querySelector('.demo-player__track-name').innerHTML}`
      }
      else {
        trackItem.track.classList.remove('playing')
        trackItem.track.classList.remove('paused')
        trackProgress.setAttribute('aria-valuenow', 0)
      }
    }

    if (nowPlayingText) {
      if (nowPlayingText !== progress.getAttribute('aria-valuetext')) {
        progress.setAttribute('aria-valuetext', nowPlayingText)
      }
    }
    else {
      progress.removeAttribute('aria-valuetext')
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
    const { _playerEl, audio, _trackList} = this
    this._getPlayPauseButton().addEventListener('click', this.toggle.bind(this))
    if (isNaN(audio.duration)) {
      audio.addEventListener('durationchange', () => this.duration = audio.duration)
    } else {
      this.duration = audio.duration
    }
    audio.addEventListener('play', () => {
      demoPlayers.forEach(player => {
        if (player !== this) {
          player.reset();
        }
      })
    })
    audio.addEventListener('play', this.setProgress.bind(this))
    const onPlayPause = this.setPlayPauseStatus.bind(this)
    audio.addEventListener('play', onPlayPause)
    audio.addEventListener('pause', onPlayPause)
    audio.addEventListener('ended', onPlayPause)
    _playerEl.addEventListener('keydown', keydownHandler(_trackList))
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

function keydownHandler(trackList) {
  return event => {
    const noOfTracks = trackList.length
    let trackIX = trackList
      .map(trackItem => trackItem.track)
      .indexOf(document.activeElement)
    switch(event.key || event.code) {
      case 'Up':
      case 'ArrowUp':
        trackIX = trackIX === -1 ? noOfTracks -1 : (trackIX - 1 + noOfTracks) % noOfTracks
        break

      case 'Down':
      case 'ArrowDown':
        trackIX = (trackIX + 1) % noOfTracks
        break;

      default:
        return
    }
    event.preventDefault()
    trackList[trackIX].track.focus()
  }
}

if (typeof Audio === 'function') {
  whenReady(() => {
    const players = document.querySelectorAll('.demo-player')
    for (let i = 0; i < players.length; i++) {
      new DemoPlayer(players[i])
    }
  })
}
