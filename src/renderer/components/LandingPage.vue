
<template>
  <div class="container">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons">
      <md-tabs ref="tabs" md-active-tab="1">
      </md-tabs>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapState } from "vuex";
import uuid from 'uuid/v4';
import path from 'path';
import { EventBus } from './LandingPage/event-bus.js';
import fs from 'fs-extra';

import {remote} from 'electron';

import { MdApp, MdDrawer, MdButton, MdContent, MdTabs, MdTable, MdCard, MdRipple, MdIcon, MdList } from 'vue-material/dist/components'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

import folderlist from './LandingPage/folderlist.vue'

Vue.use(MdContent)
Vue.use(MdTabs)


export default {
  data() {
    return {
      tabs: [],
      activeTabName: 'C:\\',
      action: '',
      workingFile: '',
      selectedFile: '',
      directory: ''
    };
  },
  methods: {
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
    createList() {      
      let newID = 't' + uuid();
      this.tabs.push({hasContent: true, label: 'C:\\', props: {id: newID}});
      this.$refs.tabs.MdTabs.items = this.tabs
      this.$refs.tabs.setActiveTab(this.tabs.length - 1);

      var newTab = document.createElement("DIV");
      newTab.id = newID;
      newTab.className = "md-tab";

      var ComponentClass = Vue.extend(folderlist)
      var instance = new ComponentClass({
          propsData: { }
      })
      instance.$slots.default = [ ]
      instance.$mount() // pass nothing

      newTab.appendChild(instance.$el);

      document.querySelector('.md-tabs-container').appendChild(newTab);
    }
  },
  created() {
    EventBus.$on('cd', directory => {
      let folderPath = path.parse(directory);
      this.renameActiveTab(path.basename(directory) ? path.basename(directory) : folderPath.root);
      this.directory = directory;
    });

    EventBus.$on('select', file => {
      this.selectedFile = file;
    });

    document.addEventListener('keydown', (evt) => {
      evt = evt || window.event;
      if (evt.code == 'KeyT' && evt.ctrlKey) {
        this.createList();
      }

      else if (evt.code == 'KeyC' && evt.ctrlKey) {        
        this.action = 'copy';
        this.workingfile = this.selectedFile;
      }
      else if (evt.code == 'KeyX' && evt.ctrlKey) {
        this.action = 'cut';
        this.workingfile = this.selectedFile;
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
  }
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