const getStatusMessage = () => document.getElementById('status-message')
const getDismissButton = () => getStatusMessage().querySelector('.status-message__dismiss')
const isStatusHidden = () => {
  const statusMsg = getStatusMessage()
  return statusMsg.innerHTML === '' || statusMsg.classList.contains(OUT_OF_VIEW_CLS)
}
const OUT_OF_VIEW_CLS = 'out-of-view'
const OUT_OF_VIEW_QUICKLY_CLS = 'quickly'
const DISMISS_DELAY = 5000

export const showStatus = message => {
  hideStatus().then(() => {
    const statusMsg = getStatusMessage()
    statusMsg.classList.add(OUT_OF_VIEW_CLS)
    statusMsg.innerHTML = `<p class="container">${message}</p><button class="status-message__dismiss">&times;</button>`
    window.setTimeout(()=> {
      statusMsg.classList.remove(OUT_OF_VIEW_CLS)
      window.setTimeout(hideStatus, DISMISS_DELAY)
      getDismissButton().addEventListener('click', dismissStatus)
    })
  })
}

export const hideStatus = () => {
  return (isStatusHidden()) ? Promise.resolve() : new Promise(resolve => {
    const statusMsg = getStatusMessage()
    const onTransitionEnd = () => {
      statusMsg.removeEventListener('transitionend', onTransitionEnd)
      statusMsg.removeEventListener('webkitTransitionEnd', onTransitionEnd)
      statusMsg.classList.remove(OUT_OF_VIEW_CLS)
      statusMsg.classList.remove(OUT_OF_VIEW_QUICKLY_CLS)
      statusMsg.innerHTML = ''
    }
    statusMsg.addEventListener('transitionend', onTransitionEnd)
    statusMsg.addEventListener('webkitTransitionEnd', onTransitionEnd)
    statusMsg.classList.add(OUT_OF_VIEW_CLS)
  })
}

const dismissStatus = () => {
  getStatusMessage().classList.add(OUT_OF_VIEW_QUICKLY_CLS)
  hideStatus()
}
