const path    = require('path')
const babel   = require('rollup-plugin-babel')
const json   = require('rollup-plugin-json')
const plugins = [
  babel({
    exclude: 'node_modules/**'
  }),
  json({
    namedExports: false 
  })
]

module.exports = {
  input: path.resolve(__dirname, '../src/js/main.js'),
  output: {
    file: path.resolve(__dirname, `../dist/js/tnvo.js`),
    format: 'iife',
  },
  plugins
}