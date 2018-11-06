const Blui = require('blui')
const { toCamelCase, indent } = require('./utils.js')

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

const instanceMap = {
  'Window': {
    need: true,
    class: 'ApplicationWindow',
    args: ['type'],
    component: 'bl-window'
  },
  'Menu': {
    need: true,
    class: 'Menu',
    args: ['type'],
    component: 'bl-menu',
    slot: 'menuBar'
  },
  'MenuItem': {
    need: false,
    class: 'MenuItem',
    args: ['title']
  },
  'Toolbar': {
    need: false,
    class: 'Toolbar',
    slot: 'toolbar'
  },
  'ToolbarItem': {
    need: false,
    props: ['label'],
    component: 'bl-toolbar-item'
  },
  'Button': {
    need: true,
    class: 'Button',
    args: ['title'],
    component: 'bl-button'
  },
  'SegmentedControl': {
    need: true,
    class: 'SegmentedControl',
    component: 'bl-segmented-control'
  }
}

//=========================
// Extract template
//=========================
/**
 * @param blui - A Blui instance.
 * @returns {String} - Compiled vue template code.
 */
function bluiToVueTemplate(blui) {
  let rtId = 0        // For annonymouse instance.
  let space = 0       // For indentation.
  let skip = false    // For menu and menu item.
  let vueTemplate = '<template>\n'
  vueTemplate += '  <!-- Loaded by vue-blui-loader -->\n'
  blui.traverse(
    null,
    node => {   // Open Handler
      const map = instanceMap[node.className]
      // Add slot if needed.
      if (map.slot && !skip) {
        space += 2
        vueTemplate += `${indent(space)}<template slot="${map.slot}">\n`
      }
      // Add vue component.
      if (map.component && !skip) {
        space += 2
        vueTemplate += `${indent(space)}<${map.component}`
      }
      // Add instance.
      if (map.need && !skip) {
        const instanceName = (node.attributes['instance'])
          ? toCamelCase(node.attributes['instance'])
          : `rt${rtId++}`
        vueTemplate += `\n${indent(space)}  :instance="${instanceName}"`
        if (node.className === 'Menu') {
          skip = true
          vueTemplate += '>\n'
        }
      } else if (map.need && skip) {
        if (!['Menu', 'MenuItem'].includes(node.parent.className)) {
          skip = false
        }
      }
      // Add props.
      if (map.props) {
        map.props.forEach(prop => {
          vueTemplate += `\n${indent(space)}  ${prop}="${node.attributes[prop]}"`
        })
      }
      // Finish vue component.
      if (map.component && !skip) {
        vueTemplate += '>\n'
      }
    },
    node => {   // Close Handler
      const map = instanceMap[node.className]
      // Skip.
      if (!skip &&
          node.parent !== null &&
          ['Menu', 'MenuItem'].includes(node.parent.className)) {
        skip = true
      } else if (skip &&
          node.parent !== null &&
          !['Menu', 'MenuItem'].includes(node.parent.className)) {
        skip = false
      }
      // Close vue component.
      if (map.component && !skip) {
        vueTemplate += `${indent(space)}</${map.component}>\n`
        space -= 2
      }
      // Close slot if exists.
      if (map.slot && !skip) {
        vueTemplate += `${indent(space)}</template>\n`
        space -= 2
      }
    })
  vueTemplate += '</template>\n'
  return vueTemplate
}

//=========================
// Extract scripts
//=========================

function menuInitializer(menuNode) {
}

/**
 * @param blui - A Blui instance.
 * @returns {Object} - { imports: String, data: String, created: String }
 */
function extractFromBlui(blui) {
  let importSet = new Set()
  let instances = []
  let rtId = 0
  let skip = false    // For menu and menu item.
  blui.traverse(
    null,
    node => {
      const map = instanceMap[node.className]
      if (map.need) {
        // Add to import set.
        importSet.add(map.class)
        // Get instance info.
        if (!skip) {
          const instanceName = (node.attributes['instance'])
            ? toCamelCase(node.attributes['instance'])
            : `rt${rtId++}`
          instances.push({
            name: instanceName,
            init: `this.${instanceName} = new ${map.class}();`
          })
          if (node.className === 'Menu') {
            skip = true
          }
        }
      }
    },
    node => {
      const map = instanceMap[node.className]
      if (map.need && skip) {
        if (!['Menu', 'MenuItem'].includes(node.parent.className)) {
          skip = false
        }
      }
    })
  return {
    imports: (() => {
      const arr = Array.from(importSet)
      let code = `
  //================================
  // Imported by vue-blui-loader
  //================================
  import {
    ${arr.join(',\n    ')}
  } from '@hardboiled65/vuetk'
  //
  //================================`
      return code
    })(),
    data: (() => {
      let instanceNames = []
      instances.forEach(instanceInfo => {
        instanceNames.push(instanceInfo.name)
      })
      return `data() {
  return {
${instanceNames.reduce((acc, cur) => (`${acc}    ${cur}: null,\n`), '')}
  };
},`
    })(),
    created: (() => {
      let inits = []
      instances.forEach(instanceInfo => {
        inits.push(instanceInfo.init)
      })
      return inits.join('\n')
    })(),
  }
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
