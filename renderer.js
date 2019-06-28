//requiring path and fs modules
const path = require('path');
const fs = require('fs-extra')
const prettyFileIcons = require('pretty-file-icons');
const remote = require('electron').remote;
const exec = require('child_process').exec;

var directoryPath
var contentClass = 'folderContents'
var copiedElement = ''
var action
var clickTimer
var activeTabIndex = 0

function closeActiveTab() {
    
    // Close program if only 1 window was open
    if (document.querySelectorAll('#tabContainer .tab').length === 1) {
        var window = remote.getCurrentWindow();
        window.close();
        return;
    }

    document.querySelectorAll('#tabContainer .tab')[activeTabIndex].remove()
    document.querySelectorAll('#tabHeader a')[activeTabIndex].remove()

    if (activeTabIndex > 0) {
        activeTabIndex--
    }

    document.querySelectorAll('#tabHeader a')[activeTabIndex].classList.add('active')
    document.querySelectorAll('#tabContainer .tab')[activeTabIndex].classList.add('active')
    
}

document.addEventListener('keydown', (e) => {
    //e.preventDefault();

    if (e.code == 'KeyT' && e.ctrlKey) {
        createNewTab();
    }

    if (e.code == 'KeyW' && e.ctrlKey) {
        e.preventDefault();
        closeActiveTab();
    }

    if (e.code == 'Delete') {
        if (document.getElementsByClassName('selected').length) {
            fs.remove(path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename')))
            .then(() => {
                getDirectoryContents(contentClass, document.querySelector('#tabContainer .active .directory').value)
            })
            .catch(err => {
            console.error(err)
            })
        }
    }  

    if (e.code == 'Enter') {
       if (e.target.className === 'directory') {
            directoryPath = document.querySelector('#tabContainer .active .directory').value
            getDirectoryContents(contentClass, directoryPath)
       }
        
        if (document.getElementsByClassName('selected').length) {

            if (document.getElementsByClassName('selected')[0].classList.contains('folder')) {
                directoryPath = path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename'))
                getDirectoryContents(contentClass, directoryPath)
            }    
            else if (document.getElementsByClassName('selected')[0].classList.contains('file')) {
                exec('start ' + path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename')));
            }
            else if (document.getElementsByClassName('selected')[0].getAttribute('data-type') === 'parent') {
                directoryPath = path.resolve(document.querySelector('#tabContainer .active .directory').value, '..')
                getDirectoryContents(contentClass, directoryPath)
            }
        }
    }
    
    if (e.code == 'KeyC' && e.ctrlKey) {
        if (document.getElementsByClassName('selected').length) {
            action = 'copy'
            copiedElement = path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename'))
        }
    }

    if (e.code == 'KeyX' && e.ctrlKey) {
        if (document.getElementsByClassName('selected').length) {
            action = 'move'
            copiedElement = path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename'))
        }
    }

    if (e.code == 'KeyV' && e.ctrlKey) {
        if (copiedElement !== '') {
            if (action === 'copy') {
                fs.copy(copiedElement, path.join(document.querySelector('#tabContainer .active .directory').value, path.basename(copiedElement)))
                .then(() => getDirectoryContents(contentClass, document.querySelector('#tabContainer .active .directory').value))
                .catch(err => console.error(err))
            }
            else if (action === 'move') {
                fs.move(copiedElement, path.join(document.querySelector('#tabContainer .active .directory').value, path.basename(copiedElement)))
                .then(() => getDirectoryContents(contentClass, document.querySelector('#tabContainer .active .directory').value))
                .catch(err => console.error(err))
            }
        }
    }
    
})

document.getElementById('tabHeader').addEventListener('click', (e) => {
    if(e.target.id === 'close') {
        var window = remote.getCurrentWindow();
        window.close();
    }

    if (e.target.tagName === 'A') {
        activeTabIndex = [...e.target.parentElement.children].filter(linkOnly).indexOf(e.target)
        
        document.querySelector("#tabHeader .active").classList.remove('active')
        e.target.classList.add('active')

        document.querySelector("#tabContainer .tab.active").classList.remove('active')
        document.querySelectorAll("#tabContainer .tab")[activeTabIndex].classList.add('active')
    }
})

document.getElementById('tabContainer').addEventListener('click', (e) => {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(function() {
        e.path.forEach( (pathEntry) => {
            if (pathEntry.tagName === 'LI') {
                if (document.getElementsByClassName('selected').length) {
                    document.getElementsByClassName('selected')[0].classList.remove('selected')
                }
                    
                pathEntry.classList.add('selected')
            }
        })

        clickTimer = 0;
    }, 250);
})

document.getElementById('tabContainer').addEventListener('dblclick', (e) => {
    clearTimeout(clickTimer);

    if (e.target.getAttribute('data-type') === 'parent') {
        directoryPath = path.resolve(document.querySelector('#tabContainer .active .directory').value, '..')
        getDirectoryContents(contentClass, directoryPath)
    }
    else {
        e.path.forEach( (pathEntry) => {
            if (pathEntry.classList) {
                if (pathEntry.classList.contains('folder')) {
                    directoryPath = path.join(document.querySelector('#tabContainer .active .directory').value, pathEntry.getAttribute('data-filename'))
                    getDirectoryContents(contentClass, directoryPath)
                }
                else if (pathEntry.classList.contains('file')) {
                    exec('start "" "' + path.join(document.querySelector('#tabContainer .active .directory').value, pathEntry.getAttribute('data-filename')) + '"');
                }
            }
        })
    }
})

getDirectoryContents(contentClass, document.querySelector('#tabContainer .active .directory').value)

function linkOnly(objElement) {
    return objElement.tagName === 'A';
}

function createNewTab() {
    document.getElementById('tabHeader').innerHTML += '<a class="active">Tab 2</a>'
    document.getElementById('tabContainer').innerHTML += '<div class="tab"><input type="text" class="directory" value="c:\\" /><div class="folderContents"></div></div>'
    document.getElementById('tabHeader').children[document.getElementById('tabHeader').childElementCount - 1].click()
    getDirectoryContents(contentClass, document.querySelector('#tabContainer .active .directory').value)
}

function getDirectoryContents(contentClass, directory) {
    // Name to set the property and the attribute for it to work correctly
    
    document.querySelector('#tabHeader .active').innerHTML = path.basename(directory) === '' ? path.dirname(directory) : path.basename(directory)

    document.querySelectorAll('#tabContainer .tab')[activeTabIndex].querySelector('.directory').value = directory
    document.querySelectorAll('#tabContainer .tab')[activeTabIndex].querySelector('.directory').setAttribute('value', directory)
    document.getElementsByClassName(contentClass)[activeTabIndex].innerHTML = '<li data-type="parent">...</li>'

    fs.readdir(directory, function (err, files) {

        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 

        files.forEach( (file) => {

            fs.lstat(path.join(directory, file), (err, stats) => {
                if (err) {
                    return console.log('Unable to scan directory: ' + err);
                }

                if (stats.isFile()) {
                    document.getElementsByClassName(contentClass)[activeTabIndex].innerHTML += `<li class="file" data-type="file" data-filename="${file}"><img class="icon" src="node_modules/pretty-file-icons/svg/${prettyFileIcons.getIcon(file, 'svg')}" />${file}</li>`
                }
                else if (stats.isDirectory()) {
                    document.getElementsByClassName(contentClass)[activeTabIndex].innerHTML += `<li class="folder" data-type="folder" data-filename="${file}"><img class="icon" src='images/folder.svg' />${file}</li>`
                }
            });
        });
    });
}