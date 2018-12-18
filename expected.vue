<template>
  <div
    :class="windowClass">
    <bl-menu
      :instance="mainMenu">
    </bl-menu>
    <bl-toolbar
      :instance="toolbar">
      <bl-toolbar-item label="Up">
        <bl-button>
        </bl-button>
      </bl-toolbar-item>
      <bl-toolbar-item label="New Folder">
        <bl-button>
        </bl-button>
      </bl-toolbar-item>
      <bl-toolbar-item label="Move">
        <bl-segmented-control>
        </bl-segmented-control>
      </bl-toolbar-item>
    </bl-toolbar>
  </div>
</template>

<script>
  //==============================
  // Imported by vue-blui-loader
  import {
    ApplicationWindow,
    Menu,
  } from '@hardboiled/vuetk'
  //
  //==============================

  export default {
    mixins: [
      {
        data() {
          return {
            mainMenu: null,
          };
        },

        created() {
          // this.instance.type
          this.instance.title = 'Sample';

          this.mainMenu = new Menu(Menu.MenuType.MenuBarMenu);
          {
            let _menuItem = new MenuItem('File');
            {
              let _submenu = new Menu(Menu.MenuType.Submenu, 'File');
              {
                let _menuItem = new MenuItem('New Folder');
                _submenu.items.push(_menuItem);
              }
              {
                let _menuItem = new MenuItem('New File');
                {
                  let _submenu = new Menu(Menu.MenuType.Submenu, 'New File');
                  {
                    let _menuItem = new MenuItem('New Text File');
                    _submenu.items.push(_menuItem);
                  }
                  _menuItem.submenu = _submenu;
                }
                _submenu.items.push(_menuItem);
              }
              _menuItem.submenu = _submenu;
            }
            mainMenu.items.push(_menuItem);
          }
          {
            let _menuItem = new MenuItem('Edit');
            {
              let _submenu = new Menu(Menu.MenuType.Submenu, 'Edit');
              {
                let _menuItem = new MenuItem('Delete');
                _submenu.items.push(_menuItem);
              }
              _menuItem.submenu = _submenu;
            }
            mainMenu.items.push(_menuItem);
          }
          {
            let _menuItem = new MenuItem('Help');
            {
              let _submenu = new Menu(Menu.MenuType.Submenu, 'Help');
              {
                let _menuItem = new MenuItem('Handbook');
                _submenu.items.push(_menuItem);
              }
              {
                let _menuItem = new MenuItem('About');
                _submenu.items.push(_menuItem);
              }
              _menuItem.submenu = _submenu;
            }
            mainMenu.items.push(_menuItem);
          }
        }
      },
    ],
  }
</script>