import whenReady from './whenReady'
import {showStatus} from './status-message'

const onContactFormSubmit = (e) => {
  e.preventDefault()
  const form = e.currentTarget

  // using 'subject' as a honeypot. If filled in, likely a bot
  if (form['subject'].value) {
    onError('Are you a robot?')
    resetForm(form)
    return
  }

  fetch('https://tomnunes.com/cgi-bin/contact.cgi', {
    method: "POST",
    body: new FormData(form)
  }).then(response => {
    if (response.ok) {
      resetForm(form)
      showStatus("Thank you for your message! I'll get back to you promptly" )
    }
    else {
      throw new Error('invalid request')
    }
  }).catch(err => {
    resetForm(form)
    onError(err.toString())
  })
}

const onError = msg => {
  showStatus('Sorry, there was a problem sending your email. Please try again, or <nobr><a href="href="emailTom">send your message direct to my email</a></nobr>')
}

const resetForm = form => {
  for (var i = 0; i < form.length; i++) {
    form[i].value = ''
  }
}

whenReady(() => {
  document.getElementById('contactForm').addEventListener('submit', onContactFormSubmit)
})