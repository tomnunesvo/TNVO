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
    const audio = this._audio = new Audio(src)
    audio.load()
    this.duration = audioEl.getAttribute('data-duration') * 1
    this._progress = 0
    this._previous = previousTrack
    if (previousTrack) {
      previousTrack._next = this
    }
    this._lastTimeUpdate = 0
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
    const progress = Math.floor((this._audio.currentTime / this._audio.duration) * 100)
    const timeDiff = Math.abs((this._lastCurrentTime || 0) - this._audio.currentTime)
    if (progressbar.classList.contains('immediate')) {
      console.log('ha!')
      return
    }

    const finish = () => {
      progressbar.style.backgroundSize = `${progress}% 100%`
      this._lastCurrentTime = this._audio.currentTime
      if (progressbar.classList.contains('immediate')) {
        setTimeout(()=> { progressbar.classList.remove('immediate') }, 300 )
      }
    }
    if (timeDiff > .5) {
      console.log('immediate')
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
          track._suspendEndedHandler = true
          track._audio.pause()
          track._audio.currentTime = prevTrack ? track._audio.duration : 0
        }
      })
    }
    this._audio.play()
  }

  pause() {
    this._audio.pause()
  }

  _bind() {
    const audio = this._audio
    const progressbar = this._progressbar

    audio.addEventListener('timeupdate', () => {
      const transtionDuration = 200
      if (this._audio.currentTime < this._audio.duration) {
        this._suspendEndedHandler = false
      }
      this.setProgress()
    })

    audio.addEventListener('ended', () => {
      if (this.isActivePlayer && this._next) {
        this._next.play()
      }
      this.isActivePlayer = false
    })

    progressbar.addEventListener('click', () => {
      const audio = this._audio
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
    })
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
  }
}

function renderPlayer() {
  return `
  <div class="demo-player__overall-progressbar">
    <button class="demo-player__play-pause"></button>
    <span class="demo-player__track-progressbars"></span>
    <button class="demo-player__show-tracks"></button>
    <button class="demo-player__download"></button>
  </div>
  `
}

whenReady(() => {
  const players = document.querySelectorAll('.demo-player')
  for (let i = 0; i < players.length; i++) {
    new DemoPlayer(players[i])
  }
})