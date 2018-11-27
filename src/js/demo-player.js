/**
 * - add <nojavascript> in header to include css to show elements normally hidden
 * - insert <audio> components, get these working under normal circumstances
 * - a message for older browsers?
 * - when player is ready
 *   - display and hide off screen (sr-only)
 *   - insert fake audio
 * 
 * AUDIO PLAYER
 * - visual component to show the attributes of audio
 * - https://developer.mozilla.org/en-US/docs/Web/Apps/Fundamentals/Audio_and_video_delivery/Video_player_styling_basics
 * 
 * 
 * PSUEDO PLAYLIST
 * - json gives the breakdown
 * - each 'track' defines start and length|end
 * - each 'track' reflects the state of audio
 * - if audio not running: not active
 * - if audio is running and position is withing track timeframe, show progress bar
 * - clicking track and not active moves audio to start position
 * 
 */

import whenReady from './whenReady'
var nextDemoTrackId = 1
class DemoTrack {
  constructor(audioEl, previousTrack) {
    this.id = nextDemoTrackId++
    const src = `audio/${audioEl.getAttribute('data-audio')}.mp3`
    const audio = this.audio = new Audio(src)
    audio.load()
    this.duration = audioEl.getAttribute('data-duration') * 1
    this._progress = 0
    this._previous = previousTrack
    if (previousTrack) {
      previousTrack._next = this
    }
    this._lastTimeUpdate = 0
    this._audioEl = audioEl
  }

  getProgressbar() {
    if (!this._progressbar) {
      const pb = this._progressbar = document.createElement('span')
      pb.className = 'demo-player__track-progressbar'
      pb.setAttribute('role', 'progressbar')
      pb.setAttribute('aria-valuenow', 0)
      pb.setAttribute('aria-valuemin', 0)
      pb.setAttribute('aria-valuemax', this.duration)
      this._bind()
    }
    return this._progressbar
  }

  setProgress() {
    const ACTIVE_PLAYER_CLS = 'activePlayer'
    const progressbar = this.getProgressbar()
    const progress = Math.floor((this.audio.currentTime / this.audio.duration) * 100)
    const timeDiff = Math.abs((this._lastCurrentTime || 0) - this.audio.currentTime)

    const finish = () => {
      progressbar.style.backgroundSize = `${progress}% 100%`
      progressbar.setAttribute('aria-valuenow', progress)
      this._lastCurrentTime = this.audio.currentTime
      if (progressbar.classList.contains('immediate')) {
        setTimeout(() => { progressbar.classList.remove('immediate') }, 300)
      }

    }
    if (timeDiff > .5) {
      progressbar.classList.add('immediate')
      setTimeout(finish, 0)
    }
    else {
      finish()
    }
  }

  play() {
    if (!this.isActivePlayer) {
      this.isActivePlayer = true
      var prevTrack = true
      this._visitEach((track) => {
        if (this === track) {
          prevTrack = false
        } else {
          track.isActivePlayer = false
          track.audio.pause()
          track.audio.currentTime = prevTrack ? track.audio.duration : 0
        }
      })
    }
    this.audio.play()
  }

  pause() {
    this.audio.pause()
  }

  toggle() {
    const audio = this.audio
    if (this.isActivePlayer) {
      if (audio.paused || audio.ended) {
        audio.play()
      }
      else {
        audio.pause()
      }
    }
    else {
      this.play()
    }
  }

  isPlaying() {
    return !(this.audio.paused || this.audio.ended)
  }

  _bind() {
    const audio = this.audio
    const progressbar = this._progressbar

    audio.addEventListener('timeupdate', () => {
      const transtionDuration = 200
      this.setProgress()
    })

    audio.addEventListener('ended', () => {
      if (this.isActivePlayer) {
        if (this._next) {
          this._next.play()
        } else {
          // after a slight delay, reset each track to 0
          setTimeout(() => {
            this._visitEach((track) => {
              track.isActivePlayer = false
              track.audio.currentTime = 0
            })
          }, 600)
        }
      }
      this.isActivePlayer = false
    })

    progressbar.addEventListener('click', this.toggle.bind(this))
  }

  _activeTrack() {
    var active = null
    this._visitEach((track) => {
      if (track.isActivePlayer) {
        active = track
      }
    })
    return active
  }

  _isPreviousTrack(trackToCheck) {
    var thisIX = -1
    var thatIX = -1
    this._visitEach((track, index) => {
      if (track === this) {
        thisIX = index
      }
      else if (track === trackToCheck) {
        thatIX = index
      }
    })
    return thatIX < thisIX
  }

  _visitEach(visit) {
    var first = this
    while (first._previous) {
      first = first._previous
    }
    var track = first
    var index = 0
    while (track) {
      visit(track, index++)
      track = track._next
    }
  }
}

class DemoPlayer {
  constructor(playerEl) {
    this._playerEl = playerEl
    playerEl.insertAdjacentHTML('afterbegin', renderPlayer())
    //for each track...
    const audioTracks = playerEl.querySelectorAll('.demo-player__audio')
    const progressBars = playerEl.querySelector('.demo-player__track-progressbars')
    const tracks = this._tracks = []
    var totalDuration = 0
    for (let i = 0; i < audioTracks.length; i++) {
      const demoTrack = new DemoTrack(audioTracks[i], tracks[i - 1])
      tracks.push(demoTrack)
      totalDuration += demoTrack.duration
      audioTracks[i].hidden = false
    }
    var pctRemaining = 100
    for (let i = 0; i < tracks.length; i++) {
      const width = Math.round(tracks[i].duration * pctRemaining / totalDuration)
      const progressbar = tracks[i].getProgressbar()
      progressBars.append(progressbar)
      progressbar.style.width = width + '%'
      progressbar.style.flex = `0 0 ${width}%`
      pctRemaining -= width
      totalDuration -= tracks[i].duration
    }
    this._bind()
  }

  toggle() {
    var activeTrack = null
    for (let i = 0; i < this._tracks.length; i++) {
      if (this._tracks[i].isActivePlayer) {
        activeTrack = this._tracks[i]
        break;
      }
    }
    if (activeTrack) {
      activeTrack.toggle()
    }
    else if (this._tracks[0]) {
      this._tracks[0].play()
    }
  }

  _bind() {
    this._getPlayPauseButton().addEventListener('click', this.toggle.bind(this))
    const onAudioStateChange = this._setPlayPauseState.bind(this)
    for (let i = 0; i < this._tracks.length; i++) {
      const audio = this._tracks[i].audio
      audio.addEventListener('timeupdate', onAudioStateChange)
      audio.addEventListener('ended', onAudioStateChange)
    }

  }

  _getPlayPauseButton() {
    return this._playerEl.querySelector('.demo-player__play-pause')
  }

  _setPlayPauseState() {
    var isPlaying = false
    for (let i = 0; i < this._tracks.length; i++) {
      if (this._tracks[i].isPlaying()) {
        isPlaying = true
      }
    }
    this._getPlayPauseButton().classList[isPlaying ? 'add' : 'remove']('pause')
  }
}

function renderPlayer() {
  return `
  <div class="demo-player__overall-progressbar">
    <button class="demo-player__play-pause"></button>
    <span class="demo-player__track-progressbars"></span>
    <button class="demo-player__show-tracks"></button>
    <a href="audio/sample.mp3" class="demo-player__download" download></a>
  </div>
  `
}

whenReady(() => {
  const players = document.querySelectorAll('.demo-player')
  for (let i = 0; i < players.length; i++) {
    new DemoPlayer(players[i])
  }
})