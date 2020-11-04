//https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Cross-browser_audio_basics#HTML5_audio_in_detail
import whenReady from './whenReady'
const demoPlayers = []

const CLICK_SRC_TRACK = 'track'
const CLICK_SRC_PLAY = 'play'

class DemoPlayer {
  constructor(playerEl) {
    this._playerEl = playerEl
    const audio = this.audio = playerEl.querySelector('audio')
    audio.parentNode.removeChild(audio)
    const wrapper = playerEl.querySelector('.demo-player__wrapper')
    wrapper.hidden = false
    this._captureTrackInfo()
    this._bind()
    this.currentTrack = -1
    demoPlayers.push(this)
  }

  toggle() {
    const audio = this.audio
    const playing = !(audio.paused || audio.ended)
    if (this.currentTrack === -1) {
      this.playTrack(0)
    }
    else {
      audio[playing ? 'pause' : 'play']()
    }
    if (!playing) {
      const source = audio.querySelector('source')
      analytics('Audio', 'play', (source && source.getAttribute('src')) || 'cannot determine')
    }
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
    if (this.waitForTrack === this._trackList[trackIX]) {
      return
    }
    const trackItem = this.waitForTrack = this._trackList[trackIX]
    const audio = this.audio

    if (!this.loadStarted) {
      // console.log('calling audio load...')
      audio.load()
    } else {
      // console.log('audio load started, calling pause...')
      audio.pause()
    }

    const poll = () => {
      if (this.waitForTrack === trackItem) { // may have clicked another
        const seekable = audio.seekable || audio.buffered
        const seekableAudio = seekable.length ? seekable.end(seekable.length - 1) : 0
        const waitForTime = (trackItem.startTime + trackItem.endTime) / 2
        // console.log('-----------')
        // console.log(`waiting for track ${trackIX + 1}; time=${waitForTime}; seekable=${seekableAudio}`)
        // console.log('-----------')
        if (seekableAudio >= waitForTime) {
          this.waitForTrack = null
          audio.currentTime = trackItem.startTime + .1
          // console.log('playing now...')
          audio.play()      
        }
        else {
          window.setTimeout(poll, 100)
        }
      }
    }

    this.setPlayPauseStatus({type: 'waiting'})
    this.setProgress()
    audio.currentTime = trackItem.startTime  + .1 // to tell browser to load to this point (?)
    poll()
  }

  setPlayPauseStatus(e) {
    const { audio, _playerEl } = this
    let audioState
    switch (e.type) {
      case 'play':
      case 'waiting':
        audioState = 'waiting'
        break;
      case 'playing':
        audioState = 'playing'
        break;
      case 'paused':
        audioState = (audio.currentTime === 0) ? '' : 'paused'
        break;
      default:
        audioState = ''
      }

      const playPause = this._getPlayPauseButton()
    _playerEl.classList.remove('playing')
    _playerEl.classList.remove('paused')
    _playerEl.classList.remove('waiting')
    if (audioState) {
      _playerEl.classList.add(audioState)
    }
    playPause.title = [audioState === 'playing' ? 'pause' : audioState === 'waiting' ? 'waiting for audio to load' : 'play']
    playPause.setAttribute('aria-label', playPause.title)
  }

  setProgress() {
    this.animationRequest = window.requestAnimationFrame(this.setProgress.bind(this))
    const { _playerEl, audio, _trackList, waitForTrack } = this
    const progress = _playerEl.querySelector('.demo-player__progress')
    const progressbar = progress.querySelector('.demo-player__progressbar')
    const valueNow = audio.currentTime
    const pct = audio.ended ? 100 : Math.min(100, 100 * valueNow / this.duration)
    progress.setAttribute('aria-valuenow', valueNow)
    progressbar.style.transform = `translateX(${pct - 100}%)`
    let nowPlayingText = ''
    for(let i=0; i<_trackList.length; i++) {
      const trackItem = _trackList[i]
      const track = trackItem.track
      const trackProgress = track.querySelector('.demo-player__track-progress')
      const trackProgressbar = trackProgress.querySelector('.demo-player__track-progressbar')
      let isCurrentTrack = (!waitForTrack && !audio.ended && audio.currentTime && valueNow >= trackItem.startTime && valueNow < trackItem.endTime)
      if (isCurrentTrack) {
        const timeRemaining = trackItem.endTime - valueNow
        if (i === (this.currentTrack - 1) && timeRemaining < .1) {
          // gone backwards. iOS has put current time to an earlier point than requested. So, to prevent flash...
          isCurrentTrack = false
        } 
      }
      else if (i === this.currentTrack) {
        const timeUntil = trackItem.startTime - valueNow
        if (timeUntil < .1) {
          // see above comment
          isCurrentTrack = true
        }
      }
      if (isCurrentTrack) {
        const trackValueNow = valueNow - trackItem.startTime
        trackItem.track.classList[audio.paused ? 'remove' : 'add']('playing')
        trackItem.track.classList[audio.paused ? 'add' : 'remove']('paused')
        trackItem.track.classList.remove('waiting')
        const trackProgressPct = audio.ended ? 100 : Math.min(100, 100 * trackValueNow / trackItem.duration)
        trackProgressbar.style.transform = `translateX(${trackProgressPct - 100}%)`
        trackProgress.setAttribute('aria-valuenow', trackValueNow)
        const currentTrackEl = _trackList[this.currentTrack] && _trackList[this.currentTrack].track 
        if (document.activeElement === currentTrackEl) {  
          track.focus()
        }
        this.currentTrack = i
        nowPlayingText = `Now playing read ${i+1}: ${trackItem.track.querySelector('.demo-player__track-name').innerHTML}`
      }
      else {
        trackItem.track.classList.remove('playing')
        trackItem.track.classList.remove('paused')
        trackItem.track.classList.remove('waiting')
        trackProgress.setAttribute('aria-valuenow', 0)
        if (waitForTrack === trackItem) {
          trackItem.track.classList.add('waiting')
        }
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
    this.currentTrack = -1
    this.waitForTrack = null
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
    audio.addEventListener('playing', this.setProgress.bind(this))
    const onPlayPause = this.setPlayPauseStatus.bind(this)
    audio.addEventListener('playing', onPlayPause)
    audio.addEventListener('pause', onPlayPause)
    audio.addEventListener('ended', onPlayPause)
    _playerEl.addEventListener('keydown', keydownHandler(_trackList))

    this.loadStarted = audio.readyState > 0
    if (!this.loadStarted) {
      const onLoadEvent = () => {
        this.loadStarted = true
        audio.removeEventListener('loadeddata' , onLoadEvent)
        audio.removeEventListener('loadstart', onLoadEvent)
      }
      audio.addEventListener('loadeddata' , onLoadEvent)
      audio.addEventListener('loadstart', onLoadEvent)
    }

    const downloadLinks = this._playerEl.querySelectorAll('a[download]')
    for(let i=0; i< downloadLinks.length; i++) {
      downloadLinks[i].addEventListener('click', e => {
        const src = downloadLinks[i].getAttribute('href') || 'cannot determine'
        analytics('Audio', 'download', src)
      })
    }
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
        if (!this.audio.paused && !this.audio.ended) {
          analytics('Audio Track', 'play', trackList[i].audio)
        } 
      })

    }
    const progressTicks = this._playerEl.querySelector('.demo-player__progress-ticks')
    if (progressTicks) {
      progressTicks.innerHTML = renderPlayerTicks(this.duration, trackList)
      const ticks = progressTicks.querySelectorAll('.demo-player__progress-tick')
      for(let i=0; i< ticks.length; i++) {
        ticks[i].addEventListener('click', ()=> {
          this.toggleTrack(i)
        })
      }  
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

function prepAudio(audio) {
  const sources = audio.querySelectorAll('source')
  if (sources[1] && audio.canPlayType(sources[0].type)) { //if browser can play .mp3
    audio.removeChild(sources[1]) // remove .ogg
  }
  audio.load()
}

function linkToRawSampleHandler() {
  const rawSampleId = 'raw-studio-sample';
  const link = document.querySelector(`a[href="#${rawSampleId}"]`);
  const rawSample = document.getElementById(rawSampleId);
  if (link && rawSampleId) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      rawSample.focus && rawSample.focus();
      analytics('Audio Track', 'link to', 'Raw audio sample');
    })
  }
}

// function logEvents(audio) {
//   const events = 'abort canplay canplaythrough durationchange emptied ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked stalled suspend timeupdate waiting'
//   events.split(' ').forEach(event => {
//     audio.addEventListener(event, e => {
//       const seekable = audio.seekable.length ? audio.seekable.end(audio.seekable.length - 1) : -1
//       console.log(`${e.type} - ct: ${audio.currentTime}; seekable: ${seekable}; rs: ${audio.readyState}; now=${new Date().getTime()}`)
//     })
//   })
// }

function analytics(category, action, label) {
  if ('function' === typeof ga) {
    // ga('send', 'event', category, action, label)
    gtag('event', action, {event_category: category, event_label: label})
  }
}

if (typeof Audio === 'function') {
  whenReady(() => {
    const players = document.querySelectorAll('.demo-player')
    for (let i = 0; i < players.length; i++) {
      new DemoPlayer(players[i])
    }
    linkToRawSampleHandler();
    window.setTimeout(() => { 
      demoPlayers
        .filter(player => !player._playerEl.classList.contains('raw-sample-demo-player'))
        .map(player => player.audio)
        .forEach(prepAudio) 
    }, 1000)
    // logEvents(demoPlayers[0].audio)
  })
}
