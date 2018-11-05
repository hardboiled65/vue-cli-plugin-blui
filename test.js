const fs = require('fs')
const Blui = require('./blui.js')

let sample = fs.readFileSync('sample.blui')
sample = sample.toString()

let blui = new Blui(sample)
console.log(blui.toString())
