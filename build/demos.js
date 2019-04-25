const { demos } = require('./demos.json')

demos.forEach(demo => {
  demo.tracks.forEach(track => {
    const {name, audio} = track
    const suffix = name.replace(/\W+/g, '-').toLowerCase()
    const descriptiveAudioName = `${audio.replace(/[\W_]\d+$/, '')}-${suffix}`
    track.descriptiveAudioName = descriptiveAudioName
  })
})

module.exports = {
  demos
}