const Blui = require('blui')

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

/**
 * Convert snake_case text to camelCase.
 */
function toCamelCase(text) {
  return text.replace(/_([a-z])/g, (match, c) => {
    return c.toUpperCase()
  })
}

const instanceMap = {
  'Window': {
    need: true,
    class: 'ApplicationWindow',
    required: ['type']
  },
  'Menu': { need: 'once', class: 'Menu' },
  'MenuItem': { need: false, class: 'MenuItem' },
  'Toolbar': { need: false, class: 'Toolbar' },
  'Button': { need: true, class: 'Button' },
}

let instances = {
  '_runtimeCount': 0,
}

function createInstance(node) {
}

function bluiToVueTemplate(blui) {
  let vueTemplate = '<template>\n'
  blui.traverse(
    null,
    node => {
      vueTemplate += `<${node.className}`
      vueTemplate += '>\n'
    },
    node => {
      vueTemplate += `</${node.className}>\n`
    })
  vueTemplate += '</template>\n'
  return vueTemplate
}

module.exports = function(source, map, meta) {
  console.log('\n== vue-blui-loader ==')
  console.log(this.resource)

  const template = getTemplate(source)
  if (!isBluiTemplate(template)) {
    return source
  }
  //=====================
  // .blui template
  //=====================
  const blui = new Blui(template)
  console.log(bluiToVueTemplate(blui))
  let result = '<!-- loaded by vue-blui-loader -->\n' + template
  result = result.replace('<Window', '<bl-window')
  result = result.replace('</Window', '</bl-window')

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
