<template>
  <div>
      <md-app>
        <md-app-drawer md-permanent="full">
          <md-list>
            <md-list-item>
              <md-button @click="cd(homedirectory)">
                <md-icon>home</md-icon>
                Home
              </md-button>
            </md-list-item>
            <md-list-item>
              <md-button @click="cd(homedirectory + 'downloads')">
                <md-icon>cloud_download</md-icon>
                Downloads
              </md-button>
            </md-list-item>
          </md-list>
        </md-app-drawer>
        <md-app-content flex>
          <md-button class="md-icon-button md-dense" @click="goUpOneFolder()">
            <md-icon>arrow_upward</md-icon>
          </md-button>
          <input ref="directoryInput" type="text" class="directory" v-model="directory" @keydown.enter="cd(directory)" />
          <button class="go hidden" @click="go">Go</button>
          <md-table v-model="folderdata" md-sort="name" md-sort-order="asc" @md-selected="onSelect" md-fixed-header>
            <md-table-row slot="md-table-row" slot-scope="{ item }" md-selectable="single" @dblclick="open(item.directory, item.type)">
              <md-table-cell md-label="Name" md-sort-by="name">
                <md-field md-inline>
                  <img class="icon" v-bind:src="item.icon" /> 
                  <md-input v-bind:id="item.id" v-model="item.name" readonly></md-input>
                </md-field>
              </md-table-cell>
            </md-table-row>
          </md-table>
        </md-app-content>
      </md-app>
  </div>
</template>

<script>
  import Vue from 'vue';
  import fs from 'fs-extra';
  import path from 'path';
  const exec = require("child_process").exec;
  const prettyFileIcons = require('pretty-file-icons');
  import uuid from 'uuid/v4';
  import os from 'os';
  import { EventBus } from './event-bus.js';
  import { MdApp, MdDrawer, MdButton, MdField, MdContent, MdTabs, MdTable, MdCard, MdRipple, MdIcon, MdList } from 'vue-material/dist/components'
  import VuejsDialog from 'vuejs-dialog';
  import 'vuejs-dialog/dist/vuejs-dialog.min.css';

  Vue.use(VuejsDialog);
  Vue.use(MdApp)
  Vue.use(MdDrawer)
  Vue.use(MdButton)
  Vue.use(MdContent)
  Vue.use(MdTabs)
  Vue.use(MdTable)
  Vue.use(MdCard)
  Vue.use(MdRipple)
  Vue.use(MdIcon)
  Vue.use(MdList)
  Vue.use(MdField)

  export default {
    name: 'folderlist',
    data: function() {
      return {
        action: '',
        renameMode: false,
        workingfile: '',
        selected: {},
        directory: 'C:\\',
        folderdata: [],
        homedirectory: os.userInfo().homedir + '\\'
      }
    },
    methods: {
      goUpOneFolder() {
        this.cd(path.resolve(this.directory, '..'));
      },

      onSelect (item) {
        if(this.selected != item & this.renameMode) {
          this.renameMode = false;
          document.getElementById(this.selected.id).setAttribute('readonly', 'readonly');
        }

        this.selected = item
      },

      go: function () {
        this.cd(this.$refs.directoryInput.value);
      },

      open: function(location, type) {
        if (type === 'folder') {
          this.cd(location);
        }
        else {
          exec('start "" "' + location + '"')
        }
      },

      cd: function (directory) {
        this.$set(this, "directory", directory);
        EventBus.$emit('cd', this.directory);
        this.dir();
      },

      dir: function () {
        if (this.directory.slice(-1) !== '\\') {
          this.directory = this.directory + '\\';
        }

        this.$set(this, "folderdata", []);

        let hasSubFolders = false;
        let hasFiles = false;
        var folders = [];
        var files = [];
        let folderListingCommand = exec('dir /B /A:D ' + this.directory);
        let fileListingCommand = exec('dir /B /A:-D ' + this.directory);

        folderListingCommand.stdout.on('close', () => {
          if (!hasSubFolders) {
            //this.$set(this, "folderdata", []);
          }
        });

        folderListingCommand.stdout.on('data', _data => {
          hasSubFolders = true;

          var res = _data.split('\r\n');
          var i = 0;

          res = res.filter((item) => !['.', '$'].includes(item.charAt(0)));
          res.forEach( (element) => {
            if (element.length) {
              this.folderdata.push({ id: 'i' + uuid(), name: element, directory: this.directory + element, icon: './static/folder.svg', type: 'folder'});
            }

            i++;
            
            if (i === res.length) {
              //this.$set(this, "folderdata", folders);
            }
          });
        }); 

        fileListingCommand.stdout.on('close', () => {
          if (!hasFiles) {
            this.$set(this, "filedata", []);
          }
        });

        fileListingCommand.stdout.on('data', _data => {
          hasFiles = true;

          var res = _data.split('\r\n');
          var i = 0;

          res = res.filter((item) => !['.', '$'].includes(item.charAt(0)));
          res.forEach( (element) => {
            if (element.length) {
              this.folderdata.push({ id: 'i' + uuid(), name: element, directory: this.directory + element, icon: `./static/fileicons/${prettyFileIcons.getIcon(element, 'svg')}`, type: 'file'});
            }

            i++;
            
            if (i === res.length) {
              //this.$set(this, "filedata", files);
            }
          });
        }); 

      }
    },
    created() {
      this.dir();
      
      document.addEventListener('keydown', (evt) => {
        evt = evt || window.event;

        if (evt.code == 'KeyC' && evt.ctrlKey) {
          this.action = 'copy';
          this.workingfile = this.selected.directory;
        }
        else if (evt.code == 'KeyX' && evt.ctrlKey) {
          this.action = 'cut';
          this.workingfile = this.selected.directory;
        }
        else if (evt.code == 'KeyV' && evt.ctrlKey) {
          if (this.action === 'copy') {
            fs.copy(this.workingfile, path.join(this.directory, path.basename(this.workingfile)));
          }
          else if (this.action === 'cut') {
            fs.move(this.workingfile, path.join(this.directory, path.basename(this.workingfile)));
          }
          this.action = '';
        }
        else if (evt.code === 'Delete') {
          let me = this;
          this.$dialog.confirm('Please confirm to continue')
            .then(function(dialog) {
              fs.remove(me.selected.directory);
            });
        }
        else if (evt.code === 'F2') {
          this.renameMode = true;
          document.getElementById(this.selected.id).removeAttribute('readonly');
        }
        else if (evt.code === 'Escape') {
          if(this.renameMode) {
            this.renameMode = false;
            document.getElementById(this.selected.id).setAttribute('readonly', 'readonly');
          }
        }
        else if (evt.code === 'Enter') {
          if(this.renameMode) {
            fs.rename(this.selected.directory, path.join(this.directory, document.getElementById(this.selected.id).value));
            this.renameMode = false;
            document.getElementById(this.selected.id).setAttribute('readonly', 'readonly');
          }
        }
      })
    }
  }
</script>
<style>
  .hidden { display: none; }

  input.directory { 
    outline: none; width: 100%; 
    border: 1px solid #ccc; 
    background: #fff; 
    line-height: 28px; 
    padding: 0 10px; 
    box-sizing: border-box; 
    border-radius: 20px;
    position: absolute;
    right: 20px;
    margin-left: 70px;
    width: -webkit-fill-available;
  }

  .icon {
    height: 20px !important; 
    vertical-align: middle; 
    margin-right: 5px; 
    width: 20px;
  }
            
  .md-app {
    max-height: 100%;
    border: 1px solid rgba(#000, .12);
  }

  .md-drawer {
    width: 200px;
  }

  .md-app-content {
    border-right: none;
    padding: 0;
  }

  .md-table {
    cursor: default;
    user-select: none;
  }

  .md-table-cell-container {
    padding: 2px 32px 2px 24px;
  }

  .md-field .md-input {
    height: 20px;
    line-height: 20px;
  }

  .md-field:before,
  .md-field:after {
    display: none;
  }

  input.md-input {
    border: 1px dashed #fff;
  }

  input[readonly].md-input {
    border: 1px solid transparent;
    user-select: none;
  }

  .md-field {
    min-height: 15px;
    max-height: 15px;
    margin: 0;
    padding: 0;
  }

  .md-app,
  .md-tabs-content,
  .md-tabs-container,
  .md-tab,
  .md-tab > div {
    height: 100%;
    max-height: 100%;
    min-height: 100%;
  }

  .md-tabs-content {
    padding-top: 50px;
  }

  .md-table-content {
    bottom: 0;
    left: 1px;
    position: absolute;
    right: 0;
    top: 50px;

    max-height: inherit !important;
    min-height: inherit !important;
    height: inherit !important;
  }

  .md-table {
    bottom: 0;
    left: 1px;
    position: absolute;
    right: 0;
    top: 30px;
  }
</style>
