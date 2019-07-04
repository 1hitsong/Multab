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
var editMode = false

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
    if (e.code === 'Escape') {
        if (editMode) makeFileNotEditable()
    }

    if (e.code == 'KeyT' && e.ctrlKey) {
        createNewTab();
    }

    if (e.code == 'KeyW' && e.ctrlKey) {
        e.preventDefault();
        closeActiveTab();
    }

    if (e.code == 'Delete') {
        if (editMode) return

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

    if (e.code == 'Enter' || e.code ==='NumpadEnter') {
        if (editMode) {
            renameFile(path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename')))
            return;
        }

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
                openFile(path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename')));
            }
            else if (document.getElementsByClassName('selected')[0].getAttribute('data-type') === 'parent') {
                directoryPath = path.resolve(document.querySelector('#tabContainer .active .directory').value, '..')
                getDirectoryContents(contentClass, directoryPath)
            }
        }
    }
    
    if (e.code == 'F2') {
        if (document.getElementsByClassName('selected').length) {
            copiedElement = path.join(document.querySelector('#tabContainer .active .directory').value, document.getElementsByClassName('selected')[0].getAttribute('data-filename'))
            makeFileEditable(copiedElement)
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
    if (editMode) return

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
    if (editMode) return

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
                    openFile(path.join(document.querySelector('#tabContainer .active .directory').value, pathEntry.getAttribute('data-filename')));
                }
            }
        })
    }
})

getDirectoryContents(contentClass, document.querySelector('#tabContainer .active .directory').value)

function openFile(filePath) {
    exec('start "" "' + filePath + '"');
}

function makeFileNotEditable() {
    editMode = false
    var el = document.querySelector('.folderContents .selected span')
    el.setAttribute('contenteditable', false)
}

function makeFileEditable(file) {
    editMode = true
    var el = document.querySelector('.folderContents .selected span')
    
    el.setAttribute('contenteditable', true)

    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function renameFile(file) {
    makeFileNotEditable();

    var newFileName = path.join(document.querySelector('#tabContainer .active .directory').value, document.querySelector('.folderContents .selected span').textContent)
    
    fs.rename(file, newFileName, (err) => {
        if (err) console.log(err);
        getDirectoryContents(contentClass, document.querySelector('#tabContainer .active .directory').value)
    })
}

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
    document.querySelector('#tabHeader .active').innerHTML = path.basename(directory) === '' ? path.dirname(directory) : path.basename(directory)

    document.querySelectorAll('#tabContainer .tab')[activeTabIndex].querySelector('.directory').value = directory
    document.querySelectorAll('#tabContainer .tab')[activeTabIndex].querySelector('.directory').setAttribute('value', directory)
    document.getElementsByClassName(contentClass)[activeTabIndex].innerHTML = '<li data-type="parent">...</li>'

    scanDirStream(directory)
}

function processFolderListing(file, type) {
    var res = file.split('\r\n')
    var fileList = ''
    var itemsProcessed = 0;

    res.forEach( (element) => {

        if (element.length !== 0) {
            if (type === 'file') {                
                fileList += `<li class="file" data-type="file" data-filename="${element}"><img class="icon" src="node_modules/pretty-file-icons/svg/${prettyFileIcons.getIcon(element, 'svg')}" /><span>${element}</span></li>`
            }
            else if (!['$', '.'].includes(element.charAt(0))) {
                fileList += `<li class="folder" data-type="folder" data-filename="${element}"><img class="icon" src='images/folder.svg' /><span>${element}</span></li>`
            }
        }

        itemsProcessed++;

        if(itemsProcessed === res.length) {
            document.getElementsByClassName(contentClass)[activeTabIndex].innerHTML += fileList
        }
    });
}

function scanDirStream(needle) {
    return new Promise((resolve, reject) => {

        var dirListing = exec('dir /B /A:D ' + needle)
        
        var fileListing = exec('dir /B /A:-D ' + needle)

        dirListing.stdout.on('data', _data => {
            processFolderListing(_data, 'directory')
        });

        fileListing.stdout.on('data', _data => {
            processFolderListing(_data, 'file')
        });
    })
}