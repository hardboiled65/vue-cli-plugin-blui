<template lang="blui">
  <Window type="AppWindow" title="Sample" instance="main_window">
    <Menu type="MenuBarMenu" instance="main_menu">
      <MenuItem title="File">
        <Menu type="Submenu" title="File">
          <MenuItem title="New Folder">
          </MenuItem>
          <MenuItem title="New File">
            <Menu type="Submenu" title="New File">
              <MenuItem title="New Text File">
              </MenuItem>
            </Menu>
          </MenuItem>
        </Menu>
      </MenuItem>
      <MenuItem title="Edit">
        <Menu type="Submenu" title="Edit">
          <MenuItem title="Delete">
          </MenuItem>
        </Menu>
      </MenuItem>
      <MenuItem title="Help">
        <Menu type="Submenu" title="Help">
          <MenuItem title="Handbook">
          </MenuItem>
          <MenuItem title="About">
          </MenuItem>
        </Menu>
      </MenuItem>
    </Menu>
    <Toolbar>
      <ToolbarItem label="Up">
        <Button type="PushButton" title="Up">
        </Button>
      </ToolbarItem>
      <ToolbarItem label="New Folder">
        <Button type="PushButton" title="New Folder">
        </Button>
      </ToolbarItem>
      <ToolbarItem label="Move">
        <SegmentedControl>
        </SegmentedControl>
      </ToolbarItem>
    </Toolbar>
    <Button type="PushButton" title="Test" instance="test_button">
    </Button>
  </Window>
</template>

<script>
  import BlWindow from '@hardboiled65/vuetk/src/components/BlWindow'

  export default {
    name: 'main-window',
    // extends: BlWindow,
  }
</script>