import uuid from 'uuid/v4';
const exec = require("child_process").exec;

const state = {
	currentdirectory: 'c:\\',
  folderlist: [],
  filelist: []
};

const actions = {
  CD ({ commit }, name) {
    commit('CD', name);
  }
};

const mutations = {
  CD (state, name) {
	  state.currentdirectory = name;
  },
  DIRFolders (state, data) {
    state.folderlist = data.slice();
  }
};

export default {
  state,
  actions,
  mutations
};