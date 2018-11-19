#!/usr/bin/env node

const fs = require('fs-extra')
const ejs = require('ejs')
const contact = require('../src/js/contact.json')

const obfuscate = parts => {
  return ['ks@jd',parts[0],'s$yej',parts[1],'#sld*g',parts[2],'isy^ggs',parts[3],'gda85w@',parts[4],'os(hshs)']
    .map(s => s ? `<span>${s}</span>` : '').join('')
  }
  
const obsfuscateEmail = () => obfuscate([contact.eName, '@', contact.eHostBase, '.', contact.eHostExt])
const obsfuscatePhone = () => obfuscate([contact.pArea, '-', contact.pExchange, '-', contact.pNumber])

const data = {
  meta: {
    title: "Tom Nunes - Professional Mail Voice Talent",
    description: "My description here",
    name: "Tom Nunes",
    url: "https://tomnunes.com/",
    socialImage: "social image tbd",
    socialImageLarge: "social image large - tbd"
  },
  obfuscatedEmail: obfuscate([contact.eName, '@', contact.eHostBase, '.', contact.eHostExt]),
  emailLabel: 'tom at tom nunes dot com',
  obfuscatedPhone: obfuscate([contact.pArea, '-', contact.pExchange, '-', contact.pNumber]),
  phoneLabel: 'eight six zero five seven three six four one nine'
}

ejs.renderFile('./src/index.ejs.html', data, (err, html) => {
  if (err) {
    console.error(err)
    process.exit(1)
    return
  }

  const outDir = './dist'
  fs.ensureDirSync(outDir)
  fs.writeFileSync(outDir+'/index.html', html, 'utf-8')
})

