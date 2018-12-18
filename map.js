const instanceMap = {
  'Window': {
    need: true,
    class: 'ApplicationWindow',
    args: [{ key: 'type', type: 'const' }],
    inits: [{ key: 'title', type: 'string' }],
    const: {
      type: 'ApplicationWindow.WindowType'
    },
    extends: {
      el: 'div',
      class: 'windowClass',
    },
    component: 'bl-window'
  },
  'Menu': {
    need: true,
    class: 'Menu',
    args: [
      { key: 'type', type: 'const' },
      { key: 'title', type: 'string', optional: true }
    ],
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
    args: [
      { key: 'type', type: 'const' },
      { key: 'title', type: 'string' }
    ],
    const: {
      type: 'Button.ButtonType'
    },
    component: 'bl-button'
  },
  'SegmentedControl': {
    need: true,
    class: 'SegmentedControl',
    component: 'bl-segmented-control'
  }
}

module.exports = {
  instanceMap,
}