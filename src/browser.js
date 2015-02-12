// namespace
var dbv = dbv || {};
dbv.browser = dbv.browser || {};

/**
* Check if the browser support WebGL.
*/
dbv.browser.checkWebGL = function (message) {
    // check webGL
    if ( !window.WebGLRenderingContext ) {
        // Browser has no idea what WebGL is.
        if ( typeof(message) !== 'undefined' ) {
            message.type = 'error';
            message.text = 'Cannot run the demo, your browser does not support WebGL. ' +
                'See <a href=\'http://get.webgl.org\'>get.webgl.org</a>.';
        }
        return false;
    }
    var testCanvas = document.createElement('canvas');
    var gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if ( !gl ) {
        // Browser could not initialize WebGL. User probably needs to
        // update their drivers or get a new browser.
        if ( typeof(message) !== 'undefined' ) {
            message.type = 'error';
            message.text = 'Cannot run the demo, your browser cannot initialize WebGL. ' +
                'See <a href=\'http://get.webgl.org/troubleshooting\'>get.webgl.org/troubleshooting</a>.';
        }
        return false;
    }
    // success
    return true;
};

/**
* Decode an input uri to get files names.
* One file: 'volume.html?input=a.dcm'.
* Multiple files: 'volume.html?input=encoded[path/to/files?file=a&file=b]'.
* @param uri The input URI.
* @return The list of files given by the URI.
*/
dbv.browser.decodeUri = function (uri) {
    var res = [];
    // expect a file or a root and multiple files
    var qmarkIndex = uri.indexOf('?');
    if ( qmarkIndex != -1 ) {
        var key = uri.substr(qmarkIndex+1, 5);
        if ( key === 'input' ) {
            var encoded = uri.substr(qmarkIndex+7);
            var decoded = decodeURIComponent(encoded);
            var qmarkIndex2 = decoded.indexOf('?');
            // one file
            if ( qmarkIndex2 === -1 ) {
                res = [decoded];
            }
            // multiple files
            else {
                var root = decoded.substr(0, qmarkIndex2 );
                var filesStr = decoded.substr(qmarkIndex2+1);
                var files = filesStr.split('&');
                var paths = [];
                for ( var i = 0; i < files.length; ++i ) {
                    var split = files[i].split('=');
                    if ( split[0] === 'file' ) {
                        paths.push( root + split[1] );
                    }
                }
                res = paths;
            }
        }
    }
    return res;
}
