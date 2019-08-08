<template>
  <div v-drag-and-drop:options="options">
      <md-app>
        <md-app-drawer md-permanent="full">
          <md-list>
            <div v-for="item in favorites">
              <md-list-item class="dropzone" v-bind:directory="item.directory">
                <md-button @click="cd(item.directory)">
                  <md-icon>{{item.icon}}</md-icon>
                  {{item.name}}
                </md-button>
              </md-list-item>
            </div>
          </md-list>
        </md-app-drawer>
        <md-app-content flex>
          <md-button class="md-icon-button md-dense" @click="goUpOneFolder()">
            <md-icon>arrow_upward</md-icon>
          </md-button>
          <md-button class="md-icon-button md-dense" @click="addToFavorites()">
            <md-icon>star</md-icon>
          </md-button>
          <input ref="directoryInput" type="text" class="directory" v-model="directory" @keydown.enter="cd(directory)" />
          <button class="go hidden" @click="go">Go</button>
          <md-table v-model="folderdata" md-sort="name" md-sort-order="asc" @md-selected="onSelect" md-fixed-header>
            <md-table-row class="dropzone" v-bind:directory="item.directory" slot="md-table-row" slot-scope="{ item }" md-selectable="single" @dblclick="open(item.directory, item.type)">
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
        options: {
          showDropzoneAreas: false,
          dropzoneSelector: ".dropzone, .md-tab-nav-button",
          draggableSelector: "tr",
          onDrop: event => this.dropItem(event)
        },
        directory: 'C:\\',
        folderdata: [],
        homedirectory: os.userInfo().homedir + '\\'
      }
    },
    props: ['favorites'],
    methods: {
      dropItem(e) {        
        let fileName = e.items[0].attributes.directory.value;
        let dropTarget = e.droptarget.attributes.directory.value;

        if (!fileName || ! dropTarget) return;
        
        if (fs.existsSync(dropTarget) && fs.lstatSync(dropTarget).isDirectory()) {
          EventBus.$emit('drag', {original: fileName, destination: path.resolve(dropTarget, path.basename(fileName))});
        }
      },
      goUpOneFolder() {
        this.cd(path.resolve(this.directory, '..'));
      },

      addToFavorites() {
        EventBus.$emit('favorite', this.directory);
      },

      onSelect (item) {
        EventBus.$emit('select', item);
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

        var folders = [];
        var files = [];
        let folderListingCommand = exec('dir /B /A:D ' + this.directory);
        let fileListingCommand;

        folderListingCommand.stdout.on('data', _data => {
          var res = _data.split('\r\n');

          res = res.filter((item) => !['.', '$'].includes(item.charAt(0)));
          res.forEach( (element) => {
            if (element.length) {
              folders.push({ id: 'i' + uuid(), name: element, directory: this.directory + element, icon: './static/folder.svg', type: 'folder'});
            }
          });
        }); 

        folderListingCommand.stdout.on('close', () => {
          this.$set(this, "folderdata", this.folderdata.concat(folders));
          fileListingCommand = exec('dir /B /A:-D ' + this.directory);

          fileListingCommand.stdout.on('data', _data => {
            var res = _data.split('\r\n');

            res = res.filter((item) => !['.', '$'].includes(item.charAt(0)));
            res.forEach( (element) => {
              if (element.length) {
                files.push({ id: 'i' + uuid(), name: element, directory: this.directory + element, icon: `./static/fileicons/${prettyFileIcons.getIcon(element, 'svg')}`, type: 'file'});
              }
            });
          }); 

          fileListingCommand.stdout.on('close', () => {
            this.$set(this, "folderdata", this.folderdata.concat(files));
          });
        });

      }
    },
    created() {
      this.dir();
    },
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
    margin-left: 110px;
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
