// namespace
var dbv = dbv || {};
dbv.gui = dbv.gui || {};

/**
* Remove all childs from a node.
*/
dbv.gui.cleanNode = function (node) {
    while (node.hasChildNodes()) {
        node.removeChild(node.firstChild);
    }
}

/**
* Remove an HTML node.
* @param id The id of the node to remove.
*/
dbv.gui.removeNode = function (id) {
    var node = document.getElementById(id);
    if ( node ) {
        dbv.gui.cleanNode(node);
        // remove it from its parent
        var top = node.parentNode;
        top.removeChild(node);
    }
}

/**
* Display an input array in a textarea.
* @param array The array to display.
* @param divName The HTML div where to display the array,
*/
dbv.gui.displayArray = function (array, divName) {
    // concatenate values in a string
    var str = '';
    for ( var i = 0; i < array.length; ++i ) {
        str += array[i] + " ";
    }

    // create text area
    var area = document.createElement('textarea');
    area.style.width = '100%';
    area.rows = 20;
    area.appendChild( document.createTextNode(str) );
    // append it to the specified div
    var div = document.getElementById(divName);
    div.appendChild(area);
};

/**
* Display an message.
* @param message The message to display.
*/
dbv.gui.displayMessage = function (message) {
    var prefix = '';
    // log
    if ( message.type === 'error' ) {
        prefix = '[ERROR] ';
        console.error(message);
    }
    else if ( message.type === 'warn' ) {
        prefix = '[WARNING] ';
        console.warn(message.text);
    }
    // html
    var par = document.createElement('p');
    par.innerHTML = prefix + message.text;
    var div = document.getElementById(message.type);
    if ( div ) {
        dbv.gui.cleanNode(div);
    }
    else {
        div = document.createElement('div');
        div.id = message.type;
    }
    div.appendChild(par);
    var body = document.body;
    body.insertBefore(div, body.firstChild);
}

/**
* Display an error message.
* @param message The message to display.
*/
dbv.gui.onError = function (message) {
    dbv.gui.displayMessage({'type': 'error', 'text': message});
}

/**
* Run a callback method when private counter is zero.
* @param callback The method to run.
* @return A function that takes an int as input to increment (+1)
*  or decrement (-1) the private counter.
*/
dbv.gui.callWhenDone = function (callback) {
    var counter = 0;
    return function ( incr ) {
        counter += incr;
        if ( 0 === counter ) {
            callback();
        }
    };
};

/**
* Animator for dat.GUI that rotates the mesh around Z.
* @param renderer The XTK renderer.
* @param mesh The XTK mesh to rotate.
*/
dbv.gui.meshZRotator = function (renderer, mesh) {
    var running = false;
    this.rotate = function () {
        if ( running ) {
            running = false;
            renderer.onRender = function () {};
        }
        else {
            running = true;
            renderer.onRender = function () {
                // rotation by 1 degree in Z direction
                mesh.transform.rotateY(1);
            };
        }
    };
};

/**
* Handle dragover events.
* @param event A dragover event.
*/
dbv.gui.onDragOver = function (event) {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // change style
    this.className = 'hover';
}

/**
* Handle dragleave events.
* @param event A dragleave event.
*/
dbv.gui.onDragLeave = function (event) {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // change style
    this.className = '';
}

/**
* Mesh panel.
* Needs to be created during onShowtime(..) since we do not know the
* mesh dimensions before the loading was completed.
* @param mesh The associated X.mesh.
* @param points The points associated to the scalars.
* @param scalarList The list of scalars arrays.
* @param renderer The X.renderer3D.
*/
dbv.gui.meshPanel = function (mesh, points, scalarList, renderer) {
    var gui = new dat.GUI();

    // mesh gui
    var meshgui = gui.addFolder('Mesh');
    // configure the mesh opacity
    //var opacityController = meshgui.add(mesh, 'opacity', 0, 1);
    // mesh rotator
    var animator = new dbv.gui.meshZRotator(renderer, mesh);
    // animate
    var animController = meshgui.add(animator, 'rotate');
    // open the folder
    meshgui.open();

    // scalars gui
    var scalarsgui = gui.addFolder('Scalars');
    // the min and max color which define the linear gradient mapping
    //var minColorController = scalarsgui.addColor(mesh.scalars, 'minColor');
    //var maxColorController = scalarsgui.addColor(mesh.scalars, 'maxColor');
    // controllers to threshold the scalars
    var minThresholdController = scalarsgui.add(mesh.scalars, 'lowerThreshold',
        mesh.scalars.min, mesh.scalars.max);
    var maxThresholdController = scalarsgui.add(mesh.scalars, 'upperThreshold',
        mesh.scalars.min, mesh.scalars.max);
    // switch scalars
    if ( scalarList.length != 0 ) {
        var scalars = { 'array': scalarList[0].name };
        scalarNames = {};
        for( var i = 0; i < scalarList.length; ++i ) {
            scalarNames[ scalarList[i].name ] = i;
        }
        var switchController = scalarsgui.add(scalars, 'array', scalarNames);
        switchController.onChange( function(value) {
            dbv.mesh.switchScalars(scalarList[value].data, mesh, points );
        });
    }
    // open the folder
    scalarsgui.open();
}

/**
* Volmue panel.
* Needs to be created during onShowtime(..) since we do not know the
* volume dimensions before the loading was completed.
* @param volume The associated X.volume.
*/
dbv.gui.volumePanel = function (volume) {
    var gui = new dat.GUI();
    // the following configures the gui for interacting with the X.volume
    var volumegui = gui.addFolder('Volume');

    // the indexX,Y,Z are the currently displayed slice indices in the range
    // 0..dimensions-1
    var sliceXController = volumegui.add(volume, 'indexX', 0,
        volume.dimensions[0] - 1).step(1);
    var sliceYController = volumegui.add(volume, 'indexY', 0,
        volume.dimensions[1] - 1).step(1);
    var sliceZController = volumegui.add(volume, 'indexZ', 0,
        volume.dimensions[2] - 1).step(1);

    // contrast
    var lowerWindowController = volumegui.add(volume, 'windowLow', volume.min,
        volume.max).step(1);
    var upperWindowController = volumegui.add(volume, 'windowHigh', volume.min,
        volume.max).step(1);

    // open the folder
    volumegui.open();
}

/**
 * Append a cell to a given row.
 * @method appendCell
 * @static
 * @param {Object} row The row to append the cell to.
 * @param {Object} object The object to insert in the cell.
 */
dbv.gui.appendCell = function(row, object)
{
    var cell = row.insertCell(-1);
    cell.appendChild(object);
};

/**
 * Append a header cell to a given row.
 * @method appendHCell
 * @static
 * @param {Object} row The row to append the header cell to.
 * @param {String} text The text of the header cell.
 */
dbv.gui.appendHCell = function(row, text)
{
    var cell = document.createElement("th");
    cell.appendChild(document.createTextNode(text));
    row.appendChild(cell);
};

/**
* Converts the input to an HTML table.
* @method toTable
* @static
* @param {Object} input The Object to display in the table.
* @param {Object} header The data to put in the tables' header row.
* @param {Object} rowCallback The callback to run with row information.
* @return {Object} The created HTML table.
*/
dbv.gui.toTable = function(input, header, rowCallback)
{
    var table = document.createElement('table');
    // body
    var keys = Object.keys(input);
    for ( var j = 0; j < keys.length; ++j ) {
        rowCallback(table, input[keys[j]], keys[j]);
    }
    // head
    var thead = table.createTHead();
    var th = thead.insertRow(-1);
    for ( var i = 0; i < header.length; ++i ) {
        dbv.gui.appendHCell(th, header[i]);
    }
    // return
    return table;
};

/**
* Converts the input to an HTML list.
* @method toList
* @static
* @param {Object} input The Object to display in the list.
* @param {Object} callback The callback to run with element information.
* @return {Object} The created HTML list.
*/
dbv.gui.toList = function(input, callback)
{
    var list = document.createElement('ul');
    // body
    var keys = Object.keys(input);
    for ( var j = 0; j < keys.length; ++j ) {
        callback(list, input[keys[j]], keys[j]);
    }
    // return
    return list;
};
