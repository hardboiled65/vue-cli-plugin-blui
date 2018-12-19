const babel = require('@babel/core')
const generate = require('@babel/generator').default
const t = babel.types

/**
 * Convert snake_case text to camelCase.
 */
function toCamelCase(text) {
  return text.replace(/_([a-z])/g, (match, c) => {
    return c.toUpperCase()
  })
}

function indent(space) {
  return ' '.repeat(space)
}

function getTemplate(source) {
  let match = /<template(.|\n)*<\/template>/[Symbol.match](source)
  if (!match) {
    console.warn('No <template> tag.')
  }
  return match[0]
}

function isBluiTemplate(template) {
  return /lang="blui"/.test(template)
}

function getScript(source) {
  let match = /<script>(.|\n)*<\/script>/[Symbol.match](source)
  if (!match) {
    console.warn('No <script> tag.')
  }
  return match[0]
}

function getExportDefault(scriptSource) {
  const regex = /export default[\s]*{(.|\n)*}/
  let match = regex[Symbol.match](scriptSource)
  if (!match) {
    console.warn('No export default.')
  }
  return match[0]
}

function isExtends(script) {
  return /extends: BlWindow/.test(script)
}

function getStyle(source) {
  let match = /<style(.|\n)*<\/style>/[Symbol.match](source)
  if (!match) {
    return ''
  }
  return match[0]
}

class Instance {
  constructor(name, cls) {
    this.name = name
    this.class = cls
  }

  new(args) {
    return `this.${this.name} = new ${this.class}(${args.join(', ')});\n`
  }

  letNew(args) {
    return `let ${this.name} = new ${this.class}(${args.join(', ')});\n`
  }

  assign(key, value) {
    return `this.${this.name}.${key} = ${value};\n`
  }
}

class Script {
  /**
   * @param code - A .vue source code.
   */
  constructor(code) {
    let scriptTag = getScript(code)
    const match = /<script>((.|\n)*)<\/script>/[Symbol.match](scriptTag)
    this._code = match[1]
    this._ast = babel.parseSync(this._code)
    babel.traverse(this._ast, {
      ExportDefaultDeclaration(path) {
        let mixins = path.node.declaration.properties.find(prop => {
          return prop.key.name === 'mixins'
        })
        if (!mixins) {
          path.get('declaration').pushContainer('properties', t.objectProperty(
            t.identifier('mixins'),
            t.arrayExpression()
          ))
        }
      }
    })
    this._code = generate(this._ast).code
  }
}

class ViewModel {
  constructor(code) {
    this._code = code
    this._ast = babel.parseSync(this._code)
  }

  get _objectExpression() {
    let decl = this._ast.program.body[0].declaration
    return decl
  }

  get _extendsAst() {
    return this._getProperty('extends')
  }

  get _mixinsAst() {
    return this._getProperty('mixins')
  }

  _getProperty(property) {
    const obj = this._objectExpression
    const properties = obj.properties
    for (let i = 0; i < properties.length; ++i) {
      if (properties[i].key.name === property) {
        return properties[i]
      }
    }
    return null
  }

  set extends(val) {
    if (this._extendsAst !== null) {
      this._extendsAst.value.name = val
    } else {
      this._objectExpression.properties.push(
        babel.types.objectProperty(
          babel.types.identifier('extends'),
          babel.types.identifier(val)
        )
      )
    }
    this._code = generate(this._ast).code
  }

  pushMixin(code) {
    // Add mixins if not exists.
    if (this._mixinsAst === null) {
      this._objectExpression.properties.push(
        t.objectProperty(
          t.identifier('mixins'),
          t.arrayExpression()
        )
      )
    }
    let ast = babel.parseSync('var _=' + code)
    const obj = ast.program.body[0].declarations[0].init
    this._mixinsAst.value.elements.push(obj)
    this._code = generate(this._mixinsAst).code
  }

  get code() {
    return this._code
  }
}

module.exports = {
  toCamelCase,
  indent,
  getTemplate,
  isBluiTemplate,
  getScript,
  getExportDefault,
  isExtends,
  getStyle,
  Instance,
  Script,
  ViewModel,
}