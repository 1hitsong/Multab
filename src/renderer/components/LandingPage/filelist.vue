<template>
  <div>
    <input type="text" class="directory" v-bind:value="directory" @keydown.enter="dir($event.target.value)" />
    <ul class="folders">
      <li class="folder" v-for="item in folderdata" :key="item.id" @dblclick="cd(item.directory)">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script>
  const exec = require("child_process").exec;
  import uuid from 'uuid/v4';

  export default {
    name: 'folderlist',
    data: function() {
      return {
        directory: 'c:\\',
        folderdata: []
      }
    },
    props: [],
    methods: {
      cd: function (directory) {
        this.directory = directory;
        this.dir();
      },

      dir: function () {
        if (this.directory.slice(-1) !== '\\') {
          this.directory = this.directory + '\\';
        }

        let hasSubFolders = false;
        var folders = [];
        let folderListingCommand = exec('dir /B /A:D ' + this.directory);

        folderListingCommand.stdout.on('close', () => {
          if (!hasSubFolders) {
            this.folderdata = [];
          }
        });

        folderListingCommand.stdout.on('data', _data => {
          hasSubFolders = true;

          var res = _data.split('\r\n');
          var i = 0;

          res = res.filter((item) => !['.', '$'].includes(item.charAt(0)));
          res.forEach( (element) => {
            if (element.length) {
              folders.push({ id: uuid(), name: element, directory: this.directory + element, type: 'folder'});
            }

            i++;
            
            if (i === res.length) {
              this.folderdata = folders;
            }
          });
        }); 
      }

    }
  }
</script>
