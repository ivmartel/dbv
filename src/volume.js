// namespace
var dbv = dbv || {};
dbv.volume = dbv.volume || {};

/**
* Add volume files to a renderer.
* @param renderer The renderer to add to.
* @param volumeFile Either a instance of a File or path to the volume file.
* @param callback A callback function that will be run at the end of the 'onload' function.
* @param gui Optional gui to add panels to.
* @param showtimeListeners Listereners to be run at showtime.
* @param
*/
dbv.volume.render = function (renderer, files, callback, gui, showtimeListeners, otherRenderers) {
    // check volume file
    var isFile = false;
    var testFileName;
    var testFile = files[0];
    if ( typeof(testFile) === 'undefined' ) {
        var message = 'Please provide a valid file.';
        throw new Error(message);
    }
    else if ( testFile instanceof File ) {
        testFileName = testFile.name;
        isFile = true;
    }
    else {
        testFileName = testFile;
    }

    // check extension
    var extension = testFileName.split('.').pop();
    if ( extension !== 'dcm' && extension !== 'nii') {
        var message1= 'Unsupported file format: ' + extension;
        throw new Error(message1);
    }

    // create a volume from the input file
    var volume = new X.volume();

    // add the object to the renderer

    // the onShowtime method gets executed after all files were fully loaded and
    // just before the first rendering attempt.
    showtimeListeners.add( function () {
        // create panel
        if ( gui ) {
            dbv.gui.addVolumePanel(gui, volume);
        }
        // call input callback
        callback(true);
    });

    var vols = [];
    var fileNames = [];
    var nread = null;

    if ( isFile ) {
        // read file count
        nread = 0;
        // id specific load handler
        var getFileLoadHandler = function (id) {
            return function (event) {
                // store datra and name
                vols[id] = event.target.result;
                fileNames[id] = files[id].name;
                ++nread;
                // when full, add array to X.volume and render it
                if ( nread === files.length ) {
                    volume.file = fileNames;
                    volume.filedata = vols;
                    renderer.add(volume);
                    renderer.render();
                    if ( otherRenderers ) {
                        showtimeListeners.add( function () {
                            for( var i = 0; i < otherRenderers.length; ++i ) {
                                otherRenderers[i].add(volume);
                                otherRenderers[i].render();
                            }
                        });
                    }
                }
            };
        };
        // error handler
        var readErrorHandler = function (event) {
            dbv.gui.onError(event.message);
            callback(false);
        };
        // read all files
        for ( var i = 0; i < files.length; ++i ) {
            var reader = new FileReader();
            reader.onload = getFileLoadHandler(i);
            reader.onerror = readErrorHandler;
            reader.readAsArrayBuffer(files[i]);
        }
    }
    else {
        // read file count
        nread = 0;
        // id specific load handler
        var getUrlLoadHandler = function (id) {
            return function (/*event*/) {
                // store data and name
                vols[id] = this.response;
                fileNames[id] = files[id];
                ++nread;
                // when full, add array to X.volume and render it
                if ( nread === files.length ) {
                    volume.file = fileNames;
                    volume.filedata = vols;
                    renderer.add(volume);
                    renderer.render();
                    if ( otherRenderers ) {
                        showtimeListeners.add( function () {
                            for( var i = 0; i < otherRenderers.length; ++i ) {
                                otherRenderers[i].add(volume);
                                otherRenderers[i].render();
                            }
                        });
                    }
                }
            };
        };
        // error handler
        var reqErrorHandler = function (/*event*/) {
            dbv.gui.onError('Error in XMLHttpRequest, status: '+this.status);
            callback(false);
        };
        // read all files
        for ( var f = 0; f < files.length; ++f ) {
            var request = new XMLHttpRequest();
            request.open('GET', files[f], true);
            request.responseType = 'arraybuffer';
            request.onload = getUrlLoadHandler(f);
            request.onerror = reqErrorHandler;
            request.send(null);
        }
    }
};
