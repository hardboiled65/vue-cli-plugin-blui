const fs = require('fs')
const Blui = require('./blui.js')
const { toCamelCase, indent, Instance } = require('./utils.js')

let sample = fs.readFileSync('sample.blui')
sample = sample.toString()

let blui = new Blui(sample)
console.log(blui.toString())
console.log('======================================')

const instanceMap = {
  'Window': {
    need: true,
    class: 'ApplicationWindow',
    args: [{ key: 'type', type: 'const' }],
    inits: [{ key: 'title', type: 'string' }],
    const: {
      type: 'ApplicationWindow.WindowType'
    },
    component: 'bl-window'
  },
  'Menu': {
    need: true,
    class: 'Menu',
    args: [{ key: 'type', type: 'const' }],
    const: {
      type: 'Menu.MenuType'
    },
    component: 'bl-menu',
    slot: 'menuBar'
  },
  'MenuItem': {
    need: false,
    class: 'MenuItem',
    args: [{ key: 'title', type: 'string' }]
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
    args: [{ key: 'title', type: 'string' }],
    component: 'bl-button'
  },
  'SegmentedControl': {
    need: true,
    class: 'SegmentedControl',
    component: 'bl-segmented-control'
  }
}

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

function instanceInitializer(node, name) {
  const map = instanceMap[node.className]
  let instance = new Instance(name, map.class)
  let code = `// Init ${name}: ${map.class}.\n`
  // Create instance with arguments.
  let args = []
  if (map.args) {
    map.args.forEach(arg => {
      if (arg.type === 'const') {
        args.push(map.const[arg.key] + '.' + node.attributes[arg.key])
      } else if (arg.type === 'string') {
        args.push(`'${node.attributes[arg.key]}'`)
      }
    })
  }
  code += instance.new(args)
  // Initialize instance with attributes.
  if (map.inits) {
    map.inits.forEach(init => {
      if (init.type === 'string') {
        code += instance.assign(init.key, node.attributes[init.key])
      }
    })
  }

  return code
}

function menuStructureBuilder(blui, menuNode) {
  let space = 0
  let code = ''
  blui.traverse(
    menuNode,
    node => {
      if (node !== menuNode) {
        code += `${indent(space)}{\n`
        space += 2
        let name = node.className === 'Menu' ? '_submenu' : '_menuItem'
        let instance = new Instance(name, node.className)
        let args = node.className === 'Menu'
          ? ['Menu.MenyType.Submenu', `'${node.attributes['title']}'`]
          : [`'${node.attributes['title']}'`]
        code += `${indent(space)}${instance.letNew(args)}`
      }
    },
    node => {
      if (node !== menuNode) {
        if (node.children.length === 0) {
          code += `${indent(space)}_submenu.items.push(_menuItem);\n`
        }
        if (node.children.length > 0 &&
            node.className === 'Menu') {
          code += `${indent(space)}_menuItem.submenu = _submenu;\n`
        } else if (node.children.length > 0 &&
            node.className === 'MenuItem') {
          if (node.parent !== menuNode) {
            code += `${indent(space)}_submenu.items.push(_menuItem);\n`
          } else {
            const instanceName = toCamelCase(menuNode.attributes['instance'])
            code += `${indent(space)}${instanceName}.items.push(_menuItem);\n`
          }
        }
        space -= 2
        code += `${indent(space)}}\n`
      }
    })

  return code
}

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
            init: instanceInitializer(node, instanceName),
            menu: (node.className === 'Menu') ? menuStructureBuilder(blui, node) : ''
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
      return 'data() {\n'
        + '  return {\n'
        + `${instanceNames.reduce((acc, cur) => (`${acc}    ${cur}: null,\n`), '')}`
        + '  };\n'
        + '},\n'
    })(),
    created: (() => {
      let inits = []
      instances.forEach(instanceInfo => {
        inits.push(instanceInfo.init + instanceInfo.menu)
      })
      return inits.join('\n')
    })(),
  }
}

console.log(bluiToVueTemplate(blui))

let script = extractFromBlui(blui)
console.log(script.imports)
console.log(script.data)
console.log(script.created)