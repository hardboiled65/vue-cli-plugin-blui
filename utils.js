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

module.exports = {
  toCamelCase,
  indent,
  Instance,
}