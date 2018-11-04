function getTemplate(source) {
  let match = /<template(.|\n)*<\/template>/[Symbol.match](source)
  if (match.length === 0) {
    console.warn('No <template> tag.')
  }
  return match[0]
}

function isBluiTemplate(template) {
  return /lang="blui"/.test(template)
}

function getScript(source) {
  let match = /<script>(.|\n)*<\/script>/[Symbol.match](source)
  if (match.length === 0) {
    console.warn('No <script> tag.')
  }
  return match[0]
}

module.exports = function(source, map, meta) {
  console.log('\n== vue-blui-loader ==')
  console.log(this.resource)
  //=====================
  // .blui template
  //=====================
  console.log('-- blui --');
  const template = getTemplate(source)
  let result = '<!-- loaded by vue-blui-loader -->\n' + template
  result = result.replace('<Window', '<bl-window')
  result = result.replace('</Window', '</bl-window')
  console.log(result)

  //=====================
  // vue script
  //=====================
  const script = getScript(source)
  if (/type=script/.test(this.resourceQuery)) {
    console.log('-- script --');
    let result = source.replace('PRINT', 'console.log')
    console.log(result)
    return result
  }
  return result
}
