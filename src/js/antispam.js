import contact  from './contact.json'

const getMailto = () => `mailto:${contact.eName}@${contact.eHostBase}.${contact.eHostExt}`
const getTel = () => `tel:+1${contact.pArea}${contact.pExchange}${contact.pNumber}`

const onMailToOrTel = ({target}) => {
  const contactMeLink = target.closest('[href="emailTom"]') || target.closest('[href="phoneTom"]')
  if (contactMeLink) {
    const origHref = contactMeLink.getAttribute('href')
    contactMeLink.href = origHref === 'emailTom' ? getMailto() : getTel()
    window.setTimeout(function() {
      contactMeLink.setAttribute('href', origHref)
    },100)
  }
}

document.addEventListener('click', onMailToOrTel)