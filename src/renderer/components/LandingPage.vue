
<template>
  <div class="container">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons" />
    <md-tabs ref="tabs" md-active-tab="0">
    </md-tabs>
    <vue-context ref="menu" :close-on-click="true">
      <template slot-scope="child" v-if="child.data">
        <li v-if="child.data.showRemoveFavorites">
            <a href="#" @click.prevent="removeFromFavorites($event, child.data)">Remove From Favorites</a>
        </li>
        <li v-if="child.data.showOpenNewTab">
            <a href="#" @click.prevent="open({data: child.data, format: 'newTab'})">Open In New Tab</a>
        </li>
        <li v-if="child.data.showOpen">
            <a href="#" @click.prevent="open(child.data.event.toElement.closest('tr').attributes)">Open</a>
        </li>

        <li v-if="child.data.showAddToFavorites">
            <a href="#" @click.prevent="addToFavorites({data: child.data})">Add To Favorites</a>
        </li>

        <li class="borderTop" v-if="child.data.showCut">
            <a href="#" @click.prevent="cutItem(child.data.event.toElement.closest('tr').attributes.directory.value)">Cut</a>
        </li>
        <li v-if="child.data.showCopy">
            <a href="#" @click.prevent="copyItem(child.data.event.toElement.closest('tr').attributes.directory.value)">Copy</a>
        </li>
        <li v-if="child.data.showCopyPath">
            <a href="#" @click.prevent="copyPath(child.data.event.toElement)">Copy Path</a>
        </li>
        
        <li class="borderTop">
            <a href="#" @click.prevent="deleteItem(child.data.event.toElement.closest('tr').attributes.directory.value)">Delete</a>
        </li>
        <li v-if="child.data.showRename">
            <a href="#" @click.prevent="enableRename(child.data.event.toElement.id)">Rename</a>
        </li>
      </template>
    </vue-context>
  </div>
</template>

<script>
  import Vue from 'vue'
  import { mapState } from "vuex";
  import uuid from 'uuid/v4';
  import path from 'path';
  import { EventBus } from './LandingPage/event-bus.js';
  import fs from 'fs-extra';
  import os from 'os';
  const exec = require("child_process").exec;

  import {remote, clipboard} from 'electron';

  import { MdApp, MdDrawer, MdButton, MdContent, MdTabs, MdTable, MdCard, MdRipple, MdIcon, MdList } from 'vue-material/dist/components'
  import 'vue-material/dist/vue-material.min.css';
  import 'vue-material/dist/theme/default.css';

  import VuejsDialog from 'vuejs-dialog';
  import 'vuejs-dialog/dist/vuejs-dialog.min.css';

  import { VueContext } from 'vue-context';

  import VueDraggable from 'vue-draggable';
  import settings from 'settings-store';

  import folderlist from './LandingPage/folderlist.vue';
  

  Vue.use(VueDraggable)
  Vue.use(MdContent)
  Vue.use(MdTabs)
  Vue.use(VuejsDialog);

  settings.init({
    appName: "multab"
  });

  if (!settings.all().hasOwnProperty('favorites')) {
    settings.setValue("favorites", [
        {name: 'Home', icon: 'home', directory: os.userInfo().homedir},
        {name: 'Downloads', icon: 'cloud_download', directory: path.resolve(os.userInfo().homedir, 'downloads')}
    ]);
  }

  export default {
    components: { VueContext },
    data() {
      return {
        isNewTab: false,
        tabs: [],
        action: '',
        workingFile: '',
        selectedFile: '',
        directory: '',
        renameMode: false,
        favorites: [],
        instance: []
      };
    },
    methods: {
      copyPath(item) {
        clipboard.writeText(item.closest('tr').attributes.directory.value);
      },
      open(data) {
        if (data.format === 'newTab') {
          this.isNewTab = true;
          this.createList(data.data.event.toElement.closest('tr').attributes.directory.value);
        }
        else {
          EventBus.$emit('open', {item: data.directory.value, type: data.type.value});
        }
      },
      copyFile(original, destination) {
        fs.copy(original, destination);
      },
      moveFile(original, destination) {
        fs.move(original, destination);
      },
      renameActiveTab(folderName) {
        let tabIndex = this.isNewTab ? this.tabs.length - 1 : this.$refs.tabs.activeTabIndex;
        this.isNewTab = false;        

        if (this.tabs[tabIndex]) {
          this.tabs[tabIndex].label = folderName;
          this.$refs.tabs.MdTabs.items = this.tabs
        }
      },
      closeTab() {
        let tabIndex = this.$refs.tabs.activeTabIndex;
        let tabID = this.$refs.tabs.MdTabs.items[tabIndex].props.id;
        
        this.tabs.splice(tabIndex, 1);
        this.$refs.tabs.MdTabs.items = this.tabs

        this.$refs.tabs.setActiveTab(0);

        document.querySelector(`#${tabID}.md-tab`).remove();

        this.instance.splice(tabIndex, 1);
      },
      removeFromFavorites(event, data) {
        let indexToRemove = [...data.event.toElement.closest("ul").children].indexOf(data.event.toElement.closest(".favorite"));
        EventBus.$emit('removefavorite', indexToRemove);
      },
      addToFavorites(data) {
        let directoryToAdd = data.data.event.toElement.closest('tr').attributes.directory.value;
        EventBus.$emit('favorite', directoryToAdd);
      },
      copyItem(item) {
        this.action = 'copy';
        this.workingfile = item;
      },
      cutItem(item) {
        this.action = 'cut';
        this.workingfile = item;
      },
      deleteItem(item) {
        this.$dialog.confirm('Please confirm to continue')
          .then(function(dialog) {
            fs.remove(item);
          });
      },
      enableRename(item) {        
        this.renameMode = true;
        document.getElementById(item).removeAttribute('readonly')
        document.getElementById(item).setAttribute('autofocus', 'autofocus');
        document.getElementById(item).focus();
      },
      createList(startingDirectory) {
        let newID = 't' + uuid();        

        startingDirectory = !startingDirectory ? 'c:\\' : startingDirectory

        this.tabs.push({hasContent: true, label: 'C:\\', props: {id: newID}});
        this.$refs.tabs.MdTabs.items = this.tabs
        this.$refs.tabs.setActiveTab(this.tabs.length - 1);

        var newTab = document.createElement("DIV");
        newTab.id = newID;
        newTab.className = "md-tab";

        var ComponentClass = Vue.extend(folderlist)
        this.instance.push(new ComponentClass({}));

        this.instance[this.instance.length - 1].$props.directory = startingDirectory;
        this.instance[this.instance.length - 1].$props.favorites = this.favorites;
        this.instance[this.instance.length - 1].$slots.default = [ ];
        this.instance[this.instance.length - 1].$mount();

        newTab.appendChild(this.instance[this.instance.length - 1].$el);
        document.querySelector('.md-tabs-container').appendChild(newTab);
      }
    },
    created() {
      this.favorites = settings.value("favorites");

      EventBus.$on('open', data => {
        if (data.type === 'folder') {
            this.instance[this.$refs.tabs.activeTabIndex].cd(data.item);
          }
          else {
            exec('start "" "' + data.item + '"')
          }
      });

      EventBus.$on('cd', directory => {
        let folderPath = path.parse(directory);
        this.renameActiveTab(path.basename(directory) ? path.basename(directory) : folderPath.root);
        this.directory = directory;
      });

      EventBus.$on('drag', data => {
        this.moveFile(data.original, data.destination);
      });

      EventBus.$on('showcontextmenu', data => {
        let options = {
          event: data.event,
          showRemoveFavorites: data.data.context==='favorites',
          showOpenNewTab: data.data.context==='folder',
          showAddToFavorites: data.data.context === 'folder',
          showOpen: data.data.context !== 'favorites',
          showCopyPath: data.data.context !== 'favorites',
          showCut: data.data.context !== 'favorites',
          showCopy: data.data.context !== 'favorites',
          showRename: data.data.context !== 'favorites'
        };

        this.$refs.menu.open(data.event, options);
      });

      EventBus.$on('favorite', directory => {

        let tempArray = [...this.favorites];

        tempArray.push({
          name: path.basename(directory) ? path.basename(directory) : path.parse(directory).root, icon: 'folder', directory: directory
        });

        tempArray = JSON.parse(JSON.stringify(tempArray));
        
        settings.setValue('favorites', tempArray);
        this.favorites = settings.value('favorites');
        this.instance.forEach((folderList) => {
          folderList.$props.favorites = this.favorites;
        });
      });

      EventBus.$on('removefavorite', index => {

        let tempArray = [...this.favorites];

        tempArray.splice(index, 1);

        tempArray = JSON.parse(JSON.stringify(tempArray));
        
        settings.setValue('favorites', tempArray);
        this.favorites = settings.value('favorites');
        this.instance.forEach((folderList) => {
          folderList.$props.favorites = this.favorites;
        });
      });

      EventBus.$on('select', file => {
        // MD is attempting to deselect item
        if (!file && this.renameMode) {
          return;
        }

        if (file && this.selectedFile) {
          if (this.selectedFile === file & this.renameMode) return;

          if (this.selectedFile != file & this.renameMode) {
            this.renameMode = false;
            document.getElementById(this.selectedFile.id).setAttribute('readonly', 'readonly');
          }
        }

        this.selectedFile = file;
      });

      document.addEventListener('keydown', (evt) => {
        evt = evt || window.event;
        if (evt.code == 'KeyT' && evt.ctrlKey) {
          this.isNewTab = true;
          this.createList();
        }
        else if (evt.code == 'KeyC' && evt.ctrlKey) {
          this.copyItem(this.selectedFile.directory);
        }
        else if (evt.code == 'KeyX' && evt.ctrlKey) {
          this.cutItem(this.selectedFile.directory);
        }
        else if (evt.code == 'KeyV' && evt.ctrlKey) {
          if (this.action === 'copy') {
            this.copyFile(this.workingfile, path.join(this.directory, path.basename(this.workingfile)));
          }
          else if (this.action === 'cut') {
            this.moveFile(this.workingfile, path.join(this.directory, path.basename(this.workingfile)));
          }
          this.action = '';
        }

        if (evt.code === 'F2') {
          this.enableRename(this.selectedFile.id);
        }
        else if (evt.code === 'Escape') {
          if (this.renameMode) {
            this.renameMode = false;
            document.getElementById(this.selectedFile.id).value = path.basename(this.selectedFile.directory);
            document.getElementById(this.selectedFile.id).setAttribute('readonly', 'readonly');
          }
        }
        else if (evt.code === 'Enter') {
          if(this.renameMode) {
            fs.rename(this.selectedFile.directory, path.join(this.directory, document.getElementById(this.selectedFile.id).value));
            this.renameMode = false;
            document.getElementById(this.selectedFile.id).setAttribute('readonly', 'readonly');
          }
        }

        else if (evt.code === 'Delete') {
          this.deleteItem(this.selectedFile.directory);
        }
        else if (evt.code == 'KeyW' && evt.ctrlKey) {
          
          if (this.tabs.length > 1) {
            evt.preventDefault();
          }
          else {
            var window = remote.getCurrentWindow();
            window.close();
          }
          this.closeTab();
        }
        else if (evt.code == 'F12') {
          remote.getCurrentWindow().toggleDevTools();
        }
      });
    },
    mounted() {
      this.createList();
    },
  };
</script>
<style>
  body {
    height: 100%;
  }
  #app {
    height: 100%;
  }

  .container {
    height: 100%;
  }

  .md-tabs {
    height: 100%;
  }

  .borderTop {
    border-top: 1px solid #ccc;
  }
</style>