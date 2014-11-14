// namespace
var dbv = dbv || {};
dbv.volume = dbv.volume || {};

/**
* Get a X.renderer3D for the input data.
* @param displayDivName The name of the HTML div in which to put the rendered mesh.
* @param sync
*/
dbv.volume.getRenderer = function (displayDivName) {
    // display div
    var displayDiv = document.getElementById(displayDivName);
    // clean div
    dbv.gui.cleanNode(displayDiv);
    // create a new 3d renderer
    var renderer = new X.renderer3D();
    renderer.container = displayDiv;
    renderer.init();
    // re-position the camera to face the volmue
    //renderer.camera.position = [0.0, 300.0, -300.0];
    renderer.camera.position = [0.0, 0.0, -400.0];
    // return
    return renderer;
}

/**
* Render the selected files.
* @param volumeFile Either a instance of a File or path to the volume file.
* @param displayDivName The name of the HTML div in which to put the rendered veolume.
* @param callback A callback function that will be run at the end of the 'onload' function.
* @param options Extra options.
*/
dbv.volume.render = function (files, displayDivName, callback, options) {

    // check volume file
    var isFile = false;
    var testFile = files[0];
    if ( typeof(testFile) === 'undefined' ) {
        var message = 'Please provide a valid file.';
        throw new Error(message);
    }
    else if ( testFile instanceof File ) {
        isFile = true;
    }

    // optionss
    var withPanel = false;
    if ( typeof(options.withPanel) != 'undefined' ) {
        withPanel = options.withPanel;
    }

    // create a volume from the input file
    var volume = new X.volume();

    // add the object to the renderer
    var renderer = dbv.volume.getRenderer(displayDivName);
    // the onShowtime method gets executed after all files were fully loaded and
    // just before the first rendering attempt.
    renderer.onShowtime = function () {
        // create panel
        if ( withPanel ) {
            dbv.gui.volumePanel(volume);
        }
        // call input callback
        callback(true);
    }

    var vols = [];
    var fileNames = [];

    if ( isFile ) {
        // read file count
        var nread = 0;
        // id specific load handler
        var getFileLoadHandler = function (id) {
            return function (event) {
                // store datra and name
                vols[id] = event.target.result;
                fileNames[id] = files[id].name;
                ++nread;
                // when full, add array to X.volume and render it
                if ( nread === files.length ) {
                    volume.file = fileNames
                    volume.filedata = vols;
                    renderer.add(volume);
                    renderer.render();
                }
            };
        };
        // read all files
        for ( var i = 0; i < files.length; ++i ) {
            var reader = new FileReader();
            reader.onload = getFileLoadHandler(i);
            reader.onerror = function (event) {
                dbv.gui.onError(event.message);
                callback(false);
            }
            reader.readAsArrayBuffer(files[i]);
        }
    }
    else {
        // read file count
        var nread = 0;
        // id specific load handler
        var getUrlLoadHandler = function (id) {
            return function (event) {
                // store data and name
                vols[id] = this.response;
                fileNames[id] = files[id];
                ++nread;
                // when full, add array to X.volume and render it
                if ( nread === files.length ) {
                    volume.file = fileNames
                    volume.filedata = vols;
                    renderer.add(volume);
                    renderer.render();
                }
            };
        };
        // read all files
        for ( var i = 0; i < files.length; ++i ) {
            var request = new XMLHttpRequest();
            request.open('GET', files[i], true);
            request.responseType = 'arraybuffer';
            request.onload = getUrlLoadHandler(i);
            request.onerror = function (event) {
                dbv.gui.onError('Error in XMLHttpRequest, status: '+this.status);
                callback(false);
            }
            request.send(null);
        }
    }
}
