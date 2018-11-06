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

module.exports = {
  toCamelCase,
  indent,
}