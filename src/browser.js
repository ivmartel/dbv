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
