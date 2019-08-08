
<template>
  <div class="container" @contextmenu.prevent="$refs.menu.open($event, {data: $event})">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons" />
    <md-tabs ref="tabs" md-active-tab="1">
    </md-tabs>
    <vue-context ref="menu">
      <template slot-scope="child">
        <li>
            <a href="#" @click.prevent="removeFromFavorites(child.data)">Remove From Favorites</a>
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

  import {remote} from 'electron';

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
      copyFile(original, destination) {
        fs.copy(original, destination);
      },
      moveFile(original, destination) {
        fs.move(original, destination);
      },
      renameActiveTab(folderName) {
        let tabIndex = this.$refs.tabs.activeTabIndex;

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
      },
      removeFromFavorites(data) {
        let indexToRemove = [...data.data.toElement.closest("ul").children].indexOf(data.data.toElement.closest(".favorite"));
        EventBus.$emit('removefavorite', indexToRemove);
      },
      createList() {      
        let newID = 't' + uuid();
        this.tabs.push({hasContent: true, label: 'C:\\', props: {id: newID}});
        this.$refs.tabs.MdTabs.items = this.tabs
        this.$refs.tabs.setActiveTab(this.tabs.length - 1);

        var newTab = document.createElement("DIV");
        newTab.id = newID;
        newTab.className = "md-tab";

        var ComponentClass = Vue.extend(folderlist)
        this.instance.push(new ComponentClass({}));

        this.instance[this.instance.length - 1].$props.favorites = this.favorites;
        this.instance[this.instance.length - 1].$slots.default = [ ]
        this.instance[this.instance.length - 1].$mount()

        newTab.appendChild(this.instance[this.instance.length - 1].$el);

        document.querySelector('.md-tabs-container').appendChild(newTab);
      }
    },
    created() {
      this.favorites = settings.value("favorites");

      EventBus.$on('cd', directory => {
        let folderPath = path.parse(directory);
        this.renameActiveTab(path.basename(directory) ? path.basename(directory) : folderPath.root);
        this.directory = directory;
      });

      EventBus.$on('drag', data => {
        this.moveFile(data.original, data.destination);
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
          this.createList();
        }
        else if (evt.code == 'KeyC' && evt.ctrlKey) {        
          this.action = 'copy';
          this.workingfile = this.selectedFile.directory;
        }
        else if (evt.code == 'KeyX' && evt.ctrlKey) {
          this.action = 'cut';
          this.workingfile = this.selectedFile.directory;
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
          this.renameMode = true;
          document.getElementById(this.selectedFile.id).removeAttribute('readonly');
        }
        else if (evt.code === 'Escape') {
          if(this.renameMode) {
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
            let me = this;
            this.$dialog.confirm('Please confirm to continue')
              .then(function(dialog) {
                fs.remove(me.selectedFile.file);
              });
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
</style>