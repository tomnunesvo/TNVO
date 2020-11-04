#!/usr/bin/env node

const fs = require('fs-extra')
const ejs = require('ejs')
const contact = require('../src/js/contact.json')
const { demos } = require('./demos.js')
const ldJSON = require('./ld+json.json')

const obfuscate = parts => {
  return ['ks@jd',parts[0],'s$yej',parts[1],'#sld*g',parts[2],'isy^ggs',parts[3],'gda85w@',parts[4],'os(hshs)']
    .map(s => `<span>${s}</span>`).join('')
  }
  
const obsfuscateEmail = () => obfuscate([contact.eName, '@', contact.eHostBase, '.', contact.eHostExt])
const obsfuscatePhone = () => obfuscate([contact.pArea, '-', contact.pExchange, '-', contact.pNumber])
const title = "Tom Nunes Voiceover — Professional Male Voice Actor"
const url = "https://tomnunes.com"
const description = `Tom Nunes, professional male voice actor, serves a vocal blend with the honesty and authority to carry 
your message in commercials, eLearning, corporate narration, explainer videos and tutorials. Tom can connect remotely for 
directed sessions over Source-Connect, ipDTL, bodalgoCall, Skype or any web-based communication platform. He produces production 
quality audio in all major formats with fast turnaround.`

const cacheBuster = (function makeid(length) {
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
})(8)

const data = {
  meta: {
    title: title,
    description: description,
    name: "Tom Nunes",
    url: url,
    socialImage: `${url}/assets/images/social-share.png`
  },
  relPath: '',
  whatIDo: "Voiceover",
  obfuscatedEmail: obfuscate([contact.eName, '@', contact.eHostBase, '.', contact.eHostExt]),
  emailLabel: 'tom at tom nunes dot com',
  obfuscatedPhone: obfuscate([contact.pArea, '-', contact.pExchange, '-', contact.pNumber]),
  phoneLabel: 'eight six zero seven five six zero two nine six',
  legalName: 'Tom Nunes Voiceover',
  cacheBuster,
  demos,
  rawSample: {
    file: "Tom_Nunes_Raw-Studio-Sample.wav",
    label: "Raw Studio Sample",
    duration: 38
  }
}

// configure ld+json
const ldjGraph = ldJSON["@graph"]
const ldjPerson = ldjGraph[0]
const ldjWebSite = ldjGraph[1]
const ldjWebPage = ldjGraph[2]
ldjPerson.image.url = data.meta.socialImage
ldjWebSite.description = data.meta.description

const outDir = './dist'
function renderFile (ejsFile, data, outFile, ldJson) {
  getLdJson(data, ldJson)
  ejs.renderFile(`./src/${ejsFile}`, data, (err, html) => {
    if (err) {
      console.error(err)
      process.exit(1)
      return
    }
  
    fs.writeFileSync(`${outDir}/${outFile}`, html, 'utf-8')
  })
  
}

function getLdJson(data, pageLdJson) {
  ldjWebPage["@id"] = `https://tomnunes.com${pageLdJson.page}/#webpage`
  ldjWebPage.url = `https://tomnunes.com${pageLdJson.page}/`
  ldjWebPage.name = data.meta.title
  ldjWebPage.datePublished = pageLdJson.published
  ldjWebPage.dateModified = new Date().toISOString()
  ldjWebPage.description = pageLdJson.description
  data.ldJSON = JSON.stringify(ldJSON)
}

fs.ensureDirSync(outDir)
const homeLdJson = {
  page: '/',
  published: "2019-05-14T00:00:00+00:00",
  description: description
}
renderFile('index.ejs.html', data, 'index.html', homeLdJson)

const privacyLdJson = {
  page: '/privacy',
  published: "2019-05-14T00:00:00+00:00",
  description: "Tom Nunes Voiceover Privacy Policy"
}
fs.ensureDirSync(`${outDir}/privacy`)
const privacyData = {...data, meta: {...data.meta, title: `Privacy Policy | ${title}`}, relPath: '../'}
renderFile('privacy/index.ejs', privacyData, 'privacy/index.html', privacyLdJson)

const searchLdJson = {
  page: '/search',
  published: "2020-02-16T04:00:00+00:00",
  description: "Tom Nunes Voiceover search page"
}
fs.ensureDirSync(`${outDir}/search`)
const searchData = {...data, meta: {...data.meta, title: `Search | ${title}`}, relPath: '../'}
renderFile('search/index.ejs', searchData, 'search/index.html', searchLdJson)

