const Blui = require('./blui.js')
const {
  toCamelCase,
  indent,
  getTemplate,
  isBluiTemplate,
  getScript,
  getExportDefault,
  isExtends,
  getStyle,
  Instance,
  ViewModel,
} = require('./utils.js')
const { instanceMap } = require('./map.js')

const path = require('path')
const fs = require('fs')


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
      if (map.slot && !node.parent.extends && !skip) {
        space += 2
        vueTemplate += `${indent(space)}<template slot="${map.slot}">\n`
      }
      // Add vue component or html element.
      if (map.component && !skip) {
        space += 2
        vueTemplate += (!node.extends)
          ? `${indent(space)}<${map.component}`
          : `${indent(space)}<${map.extends.el}`
      }
      // Add instance.
      if (map.need && !node.extends && !skip) {
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
      if (node.extends) {
        vueTemplate += `\n${indent(space)}  :class="${map.extends.class}"`
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
      // Close vue component or html element.
      if (map.component && !skip) {
        vueTemplate += (!node.extends)
          ? `${indent(space)}</${map.component}>\n`
          : `${indent(space)}</${map.extends.el}>\n`
        space -= 2
      }
      // Close slot if exists.
      if (map.slot && !node.parent.extends && !skip) {
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

function instanceInitializer(node, name) {
  if (node.extends) {
    name = 'instance'
  }
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
  if (!node.extends) {
    code += instance.new(args)
  }
  // Initialize instance with attributes.
  if (map.inits) {
    map.inits.forEach(init => {
      if (init.type === 'string') {
        code += instance.assign(init.key, `'${node.attributes[init.key]}'`)
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
          ? ['Menu.MenuType.Submenu', `'${node.attributes['title']}'`]
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
            code += `this.${indent(space)}${instanceName}.items.push(_menuItem);\n`
          }
        }
        space -= 2
        code += `${indent(space)}}\n`
      }
    })

  return code
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
          if (!node.extends) {
            instances.push({
              name: instanceName,
              init: instanceInitializer(node, instanceName),
              menu: (node.className === 'Menu')
                ? menuStructureBuilder(blui, node)
                : '',
            })
          }
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
      return 'created() {'
        + inits.join('\n')
        + '},\n'
    })(),
  }
}

module.exports = function(source, map, meta) {
  const template = getTemplate(source)
  if (!isBluiTemplate(template)) {
    return source
  }

  console.log('\n== vue-blui-loader ==')
  console.log(this.resource)
  if (/\.vue$/.test(this.resource) === false) {
    return source
  }

  // Debug output.
  fs.mkdirSync('node_modules/.blui-loader')

  let vue = {
    template: null,
    script: null,
    style: null
  }

  // Gather parts.
  let script = getScript(source)
  const extend = isExtends(script)

  //=====================
  // .blui template
  //=====================
  const blui = new Blui(template, extend)
  // console.log(bluiToVueTemplate(blui))
  vue.template = bluiToVueTemplate(blui)
  fs.writeFileSync(`node_modules/.blui-loader/${path.basename(this.resource)}.template`,
    vue.template)

  //=====================
  // vue script
  //=====================
  const scriptParts = extractFromBlui(blui)
  const viewModelCode = getExportDefault(script)
  let viewModel = new ViewModel(viewModelCode)
  script = script.replace('<script>', '<script>\n' + scriptParts.imports)
  script = script.replace('mixins: []', 'mixins:[{' + scriptParts.data + scriptParts.created + '}]')
  vue.script = script
  // console.log(vue.script)
  fs.writeFileSync(`node_modules/.blui-loader/${path.basename(this.resource)}.script`,
    vue.script)

  //=====================
  // style
  //=====================
  vue.style = getStyle(source)

  // Merge and return.
  return vue.template + '\n' + vue.script + '\n' + vue.style + '\n'
}
