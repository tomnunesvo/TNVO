#!/usr/bin/env node

const fs = require('fs-extra')
const ejs = require('ejs')
const contact = require('../src/js/contact.json')
const { demos } = require('./demos.json')

const obfuscate = parts => {
  return ['ks@jd',parts[0],'s$yej',parts[1],'#sld*g',parts[2],'isy^ggs',parts[3],'gda85w@',parts[4],'os(hshs)']
    .map(s => s ? `<span>${s}</span>` : '').join('')
  }
  
const obsfuscateEmail = () => obfuscate([contact.eName, '@', contact.eHostBase, '.', contact.eHostExt])
const obsfuscatePhone = () => obfuscate([contact.pArea, '-', contact.pExchange, '-', contact.pNumber])
const title = "Tom Nunes Voiceover — Savor the Sound"

const data = {
  meta: {
    title: title,
    description: "My description here",
    name: "Tom Nunes",
    url: "https://tomnunes.com",
    socialImage: "social image tbd",
    socialImageLarge: "social image large - tbd",
  },
  relPath: '',
  whatIDo: "Voiceover",
  obfuscatedEmail: obfuscate([contact.eName, '@', contact.eHostBase, '.', contact.eHostExt]),
  emailLabel: 'tom at tom nunes dot com',
  obfuscatedPhone: obfuscate([contact.pArea, '-', contact.pExchange, '-', contact.pNumber]),
  phoneLabel: 'eight six zero five seven three six four one nine',
  legalName: 'Tom Nunes Voiceover',
  demos
}

const outDir = './dist'
function renderFile (ejsFile, data, outFile) {
  ejs.renderFile(`./src/${ejsFile}`, data, (err, html) => {
    if (err) {
      console.error(err)
      process.exit(1)
      return
    }
  
    fs.writeFileSync(`${outDir}/${outFile}`, html, 'utf-8')
  })
  
}

fs.ensureDirSync(outDir)
renderFile('index.ejs.html', data, 'index.html')

fs.ensureDirSync(`${outDir}/privacy`)
const privacyData = {...data, meta: {...data.meta, title: `Privacy Policy | ${title}`}, relPath: '../'}
renderFile('privacy/index.ejs', privacyData, 'privacy/index.html')

