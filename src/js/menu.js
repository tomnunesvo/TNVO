import whenReady from './whenReady'

const scrollDownThreshhold = 400
const scrollUpThreshhold = 300
const fixedClass = 'menu-fixed'
const fixedClassIn = 'in'

let menuHandler = revealMenuHandler
let menu
let scrolling = false;

function revealMenuHandler() {
  if (window.pageYOffset > scrollDownThreshhold) {
    menu.classList.add(fixedClass)
    window.requestAnimationFrame(() => {
      menu.classList.add(fixedClassIn)
    })
    menuHandler = restoreMenuHandler
  }
}

function restoreMenuHandler() {
  if (window.pageYOffset < scrollUpThreshhold) {
    const onTransitionEnd = () => {
      menu.removeEventListener('transitionend', onTransitionEnd)
      window.clearTimeout(timeout)
      menu.classList.remove(fixedClass)
    }
    const timeout = window.setTimeout(onTransitionEnd, 1000)
    menu.addEventListener('transitionend', onTransitionEnd)
    menu.classList.remove(fixedClassIn)
    menuHandler = revealMenuHandler
  }
}

function run() {
  menuHandler();
  if (scrolling) {
    window.requestAnimationFrame(run)
  }
}

function onScroll() {
  let timeout = 0
  return () => {
    if (scrolling) {
      window.clearTimeout(timeout)
    } else {
      scrolling = true
      run()
    }
    timeout = window.setTimeout(() => scrolling = false, 300)
  }
}

whenReady(() => {
  menu = document.querySelector('.tnvo-header__menu')
  if (menu && !document.querySelector('.tnvo-header-cap')) {
    let timeout = 0
    document.addEventListener('scroll', onScroll())
    window.setTimeout(run, 600)
  }
})