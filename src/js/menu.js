import whenReady from './whenReady'

const scrollDownThreshhold = 400
const scrollUpThreshhold = 300
const fixedClass = 'menu-fixed'
const fixedClassIn = 'in'
const fixedClassActive = 'active'
let handler = revealMenuHandler
let menu
let scrolling = false;

function revealMenuHandler() {
  if (window.pageYOffset > scrollDownThreshhold) {
    handler = restoreMenuHandler
    menu.classList.add(fixedClass)
    window.requestAnimationFrame(() => {
      menu.classList.add(fixedClassIn)
    })
  }
}

function restoreMenuHandler() {
  if (window.pageYOffset < scrollUpThreshhold) {
    handler = revealMenuHandler
    const onTransitionEnd = () => {
      menu.removeEventListener('transitionend', onTransitionEnd)
      menu.removeEventListener('webkitTransitionEnd', onTransitionEnd)
      menu.classList.remove(fixedClass)
    }
    menu.addEventListener('transitionend', onTransitionEnd)
    menu.addEventListener('webkitTransitionEnd', onTransitionEnd)
    menu.classList.remove(fixedClassIn)
  }
}

function run() {
  handler();
  if (scrolling) {
    window.requestAnimationFrame(run)
  }
  else { console.log('all done')}
}

whenReady(() => {
  let timeout = 0
  if (!document.querySelector('.tnvo-header-cap')) {
    menu = document.querySelector('.tnvo-header__menu')
    if (menu) {
      document.addEventListener('scroll', () => {
        if (scrolling) {
          window.clearTimeout(timeout)
        } else {
          scrolling = true
          run()
        }
        timeout = window.setTimeout(() => {
          scrolling = false
        }, 300)
      })
      run()
    }
  }
})

