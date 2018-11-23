export default callback => {
  if (document.readyState === 'loading') {
    const handler = () => {
      callback()
      document.removeEventListener('DOMContentLoaded', handler)
    }
    document.addEventListener('DOMContentLoaded', handler)
  }
}