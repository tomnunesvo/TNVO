const cpy = require('cpy')
const { demos } = require('./demos')
const files = []
const renameMap = {}

const src = 'src/audio/'
const dest = 'dist/audio/'

demos.forEach(demo => {
  demo.tracks.forEach(track => {
    const {audio, descriptiveAudioName} = track
    if (audio !== descriptiveAudioName) {
      renameMap[`${audio}.mp3`] = `${descriptiveAudioName}.mp3`
      renameMap[`${audio}.ogg`] = `${descriptiveAudioName}.ogg`
    }
  })
})

cpy([`${src}*.mp3`, `${src}*.ogg`, `${src}*.wav`], dest, {rename: basename => renameMap[basename] || basename})