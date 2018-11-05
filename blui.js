const libxml = require('libxmljs')

class Element {
  constructor(tag, obj) {
    this.tag = tag
    this.self = obj
  }

  get attrib() {
    let result = {}
    let attrs = this.self.attrs()
    for (let i = 0; i < attrs.length; ++i) {
      result[attrs[i].name()] = attrs[i].value()
    }
    return result
  }

  getChildren() {
    let children = []
    const childNodes = this.self.childNodes()
    for (let i = 0; i < childNodes.length; ++i) {
      const childNode = childNodes[i]
      if (childNode.type() === 'element') {
        let el = new Element(childNode.name(), childNode)
        children.push(el)
      }
    }
    return children
  }
}

class Node {
  constructor() {
    this.parent = null
    this.className = ''
    this.attributes = {}
    this.children = []
  }

  append(node) {
    this.children.push(node)
  }
}

class Blui {
  static get Node() {
    return Node
  }

  constructor(template) {
    this.version = ''

    this._blui = null
    this._template = template

    this._parse(template)
  }

  get root() {
    return this._blui
  }

  _parse(template) {
    let tree = libxml.parseXml(template)

    this.version = '0.1'

    const keys = Object.keys(tree)
    let el = new Element('template', tree.root())
    this._parseChild(el, null)
  }

  _parseChild(el, node) {
    const children = el.getChildren()
    for (let i = 0; i < children.length; ++i) {
      const child = children[i]

      let newNode = new Blui.Node()
      newNode.parent = node
      newNode.className = child.tag
      if (node === null) {
        this._blui = newNode
      } else {
        node.append(newNode)
      }
      const keys = Object.keys(child.attrib)
      // Set attributes
      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i]
        newNode.attributes[key] = child.attrib[key]
      }
      this._parseChild(child, newNode)
    }
  }

  traverse(node, handler, afterHandler=null) {
    if (!node) { node = this.root }
    handler(node)
    for (let i = 0; i < node.children.length; ++i) {
      this.traverse(node.children[i], handler, afterHandler)
    }
    afterHandler ? afterHandler(node) : null
  }

  toString() {
    let vueTemplate = '<template>\n'
    this.traverse(
      null,
      node => {
        vueTemplate += `<${node.className}>\n`
      },
      node => {
        vueTemplate += `</${node.className}>\n`
      })
    vueTemplate += '</template>\n'
    return vueTemplate
  }
}

module.exports = Blui