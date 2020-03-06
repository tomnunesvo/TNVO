import whenReady from './whenReady'
whenReady(() => {
  const intro = document.querySelector('.section-intro')
  if (intro) {
    window.setTimeout(() => {
      intro.classList.add('show-backup')
    }, 1000)
  }
})
