#!/usr/bin/env node

const data = require('../src/index.html.json')
const fs = require('fs')
const ejs = require('ejs')

ejs.renderFile('./src/index.ejs.html', data, (err, html) => {
  if (err) {
    console.error(err)
    process.exit(1)
    return
  }

  fs.writeFileSync('./dist/index.html', html, 'utf-8')
})

