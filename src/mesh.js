// namespace
var dbv = dbv || {};
dbv.mesh = dbv.mesh || {};

/**
* toPrecision method for a 3D array.
* @param vector The input 3D array.
* @param digits The number of digits.
* @return The truncated/rounded (if neede) 3D array.
*/
dbv.mesh.toPrecision = function ( vector, digits ) {
    return [ vector[ 0 ].toPrecision(digits),
        vector[ 1 ].toPrecision(digits),
        vector[ 2 ].toPrecision(digits) ]
}

/**
* toPrecision method for a 3D string array.
* @param vector The input 3D string array.
* @param digits The number of digits.
* @return The truncated/rounded (if neede) 3D array.
*/
dbv.mesh.strToPrecision = function ( vector, digits ) {
    return dbv.mesh.toPrecision( [
        parseFloat(vector[ 0 ]),
        parseFloat(vector[ 1 ]),
        parseFloat(vector[ 2 ]) ], digits );
}

/**
* Filter a scalar array to remove all un-matched points.
* @param pointsA Point list to parse, type: X.triplets.
* @param pointsB Reference points, type: array, storage: [x0, y0, z0, x1, y1, z1, ...].
* @param scalarsB Reference scalars, type: array, storage: [s0, s1, s2, ...].
* @return The result array (or scalarsA), type: array, storage: [s0, s0, s0, s1, s1, s1, ...].
*/
dbv.mesh.filterScalars = function ( pointsA, pointsB, scalarsB ) {
    // associate pointsB and scalarsB to easily find them
    var precision = 6;
    var dataB = {};
    for ( var j = 0; j < pointsB.length / 3; ++j ) {
        var jindex = j * 3;
        var pointB = dbv.mesh.strToPrecision( [
            pointsB[ jindex ],
            pointsB[ jindex + 1 ],
            pointsB[ jindex + 2 ] ], precision );
        dataB[ pointB ] = scalarsB[j];
    }
    var size = pointsA.length / 3;
    var scalarsA = new Float32Array(size * 3);
    var nUnmatch = 0;
    for ( var i = 0; i < size; ++i ) {
        // get scalar value
        scalarA = 0;
        var pointA = dbv.mesh.toPrecision(pointsA.get(i), precision);
        if ( dataB.hasOwnProperty(pointA) ) {
            scalarA = dataB[pointA];
        }
        else {
            nUnmatch++;
            console.log("Unmatched point: "+pointA[0]+", "+pointA[1]+", "+pointA[2]);
        }
        if ( nUnmatch > 200 ) {
            console.log("More than 200 unmatched...");
            return;
        }
        // store it
        var index = i * 3;
        scalarsA[ index ] = scalarA;
        scalarsA[ index + 1 ] = scalarA;
        scalarsA[ index + 2 ] = scalarA;
    }
    return scalarsA;
};

/**
* Function to tell if an input VTK file is stored using ASCII.
* @param text The VTK file content.
* @return True is the file is stored using ASCII.
*/
dbv.mesh.isASCII = function ( text ) {
    // check for the presence of 'ASCII' string and
    //   not for 'BINARY'.
    if ( text.indexOf('ASCII') != -1 &&
        text.indexOf('BINARY') === -1) {
        return true;
    }
    // default
    return false;
};

/**
* Function to tell if an input VTK file is POLYDATA.
* @param text The VTK file content.
* @return True is the file is POLYDATA.
*/
dbv.mesh.isPOLYDATA = function ( text ) {
    // check for the 'DATASET POLYDATA' string.
    if ( text.indexOf('DATASET POLYDATA') != -1 ) {
        return true;
    }
    // default
    return false;
};

/**
* Parse VTK points and point data from an input string.
* @param buffer The buffer to parse, either an ArrayBuffer or raw string.
* Basic scheme:

# vtk DataFile Version 3.0
vtk output
ASCII
DATASET POLYDATA
POINTS 1348 float
26.2535 5.96237 152.294 26.2535 5.47613 151.824 23.8394 10.7907 154.858
(...)
POLYGONS 2652 10608
3 4 730 3
(...)
POINT_DATA 1348
SCALARS dName float
LOOKUP_TABLE ltName <--- [optional]
1.0 1.0 1.0
(...)
FIELD FieldData 1 <--- [optional]
LAT 1 1348 float  <--- [optional]
19.3237 19.0651 19.2394 17.5364 16.0927 14.7257 29.9411 25.8279 24.5271
(...)

* WARNING: does not support scalar names with numbers.
*/
dbv.mesh.parseVtk = function ( buffer ) {
    // accepts ArrayBuffer or raw string
    var text;
    if ( buffer instanceof ArrayBuffer ) {
        var array = new Uint8Array(buffer);
        for ( var i = 0; i < array.length; ++i ) {
            text += String.fromCharCode(array[i]);
        }
    }
    else {
        text = buffer;
    }

    // slice header to speed up
    var header = text.slice(0,100);

    // check ASCII
    if ( !dbv.mesh.isASCII(header) ) {
        throw new Error('Unsupported binary VTK file.');
    }
    // check POLYDATA
    if ( !dbv.mesh.isPOLYDATA(header) ) {
        throw new Error('Unsupported non POLYDATA VTK file.');
    }

    // get keyword positions
    var indexPoints = text.indexOf('POINTS');
    if ( indexPoints === -1 ) {
        throw new Error('Cannot find the POINTS keyword.');
    }
    var indexPolygons = text.indexOf('POLYGONS');
    if ( indexPolygons === -1 ) {
        throw new Error('Cannot find the POLYGONS keyword.');
    }
    var indexPointData = text.indexOf('POINT_DATA');
    var indexField = text.indexOf('FIELD');

    // number pattern
    var pattNum = /[-]?[0-9]+(\.[0-9]+)?/g; // positive/negative float number with a space behind
    var pattStr = /[a-zA-Z][a-zA-Z0-9_%]+/g; // names with underscore and possible numbers

    // read points
    var textPoints = text.slice( indexPoints, indexPolygons );
    var points = textPoints.match( pattNum );
    // first element is the number of points
    var pointsReadSize = points[0];
    points = points.slice(1); // remove it
    var pointsSize = points.length / 3; // 3D vectors
    if ( pointsSize != pointsReadSize ) {
        var message = 'Not the expected number of points: ' + pointsSize + ' != ' + pointsReadSize;
        throw new Error(message);
    }

    var scalars = [];

    // read point data
    if ( indexPointData != -1 ) {
        var textPointData;
        if ( indexField === -1 ) {
            textPointData = text.slice( indexPointData );
        }
        else {
            textPointData = text.slice( indexPointData, indexField );
        }
        // data name
        var stringsPointData = textPointData.match( pattStr );
        // remove lookup table strings: 'LOOKUP_TABLE name'
        var stringsPointData2 = [];
        var index = 1;
        while ( index < stringsPointData.length ) {
            if ( stringsPointData[index] === 'LOOKUP_TABLE' ) {
                index += 2;
            }
            else {
                stringsPointData2.push( stringsPointData[index] );
                ++index
            }
        }
        var nPointData = stringsPointData2.length / 3;
        // data
        var pointData = textPointData.match( pattNum );
        // first element is the number of scalars
        var pointDataReadSize = pointData[0];
        // global check
        if ( pointDataReadSize != pointsSize ) {
            var message = 'Not the expected number of point data: ' +
                pointDataReadSize + ' != ' + pointsSize;
            throw new Error(message);
        }
        pointData = pointData.slice(1); // remove it
        // read all point data
        index = 0;
        for ( var i = 0; i < nPointData; ++i ) {
            var pointDataType = stringsPointData2[i*3].toLowerCase();
            var pointDataName = stringsPointData2[i*3 + 1];
            var pointDataSize = pointDataReadSize;
            if ( pointDataType != 'scalars' ) {
                pointDataSize *= 3;
            }
            var localPointData = pointData.slice(index, index + pointDataSize);
            index += pointDataSize;
            scalars.push( {'name': pointDataName, 'data': localPointData, 'type': pointDataType} );
        }
    }

    // read field data
    if ( indexField != -1 ) {
        var sliceFieldData = text.slice( indexField );
        // data name
        var stringsFieldData = sliceFieldData.match( pattStr );
        // data
        var fieldData = sliceFieldData.match( pattNum );
        // first element is the number of fields
        var readNField = fieldData[0];
        fieldData = fieldData.slice(1); // remove it
        var fmul = 1;
        var fsize = 0;
        var fstart = 0;
        for ( var i = 0; i < readNField; ++i ) {
            var readFieldDataName = stringsFieldData[2 + i*2];
            fmul = fieldData[fstart];
            fsize = fieldData[fstart + 1];
            fstart += 2;
            var localFieldData = fieldData.slice(fstart, fstart + fmul * fsize); // remove first 2 scalars
            fstart += fmul * fsize;
            var nfielddata = localFieldData.length / fmul;
            // local check
            if ( nfielddata != fsize ) {
                var message = 'Not the expected number of field data (' +
                    readFieldDataName + '): ' +
                    nfielddata + ' != ' + fsize;
                throw new Error(message);
            }
            // global check
            if ( nfielddata != pointsSize ) {
                var message = 'Too many/few field data: ' + nfielddata + ' != ' + pointsSize;
                throw new Error(message);
            }
            scalars.push( {'name': readFieldDataName, 'data': localFieldData, 'type': 'field'} );
        }
    }

    // return
    return { 'points': points, 'scalars': scalars };
};

/**
* Parse scalars from an input text.
* @param text A text string.
*/
dbv.mesh.parseScalars = function ( text ) {
    // number pattern
    var regex = /[-]?[0-9]+(\.[0-9]+)?/g;
    var textArray = text.match(regex);
    // store in a typed array
    var scalars = new Float32Array(textArray.length);
    for ( var i = 0; i < textArray.length; ++i ) {
        scalars[i] = textArray[i];
    }
    return scalars;
};

/**
* Count unique points in an input X.triplets.
* @param triplets The XTK triplets (X.triplets).
*/
dbv.mesh.countUniquePoints = function ( triplets ) {
    var size = triplets.length / 3;
    var cleanedPoints = [];
    var point = null;
    var cleanPoint = null;
    var isFound = false;
    for ( var i = 0; i < size; ++i ) {
        point = triplets.get(i);
        isFound = false;
        for ( var j = 0; j < cleanedPoints.length; ++j ) {
            cleanPoint = cleanedPoints[j];
            if ( cleanPoint[0] == point[0] &&
                cleanPoint[1] == point[1] &&
                cleanPoint[2] == point[2] ) {
                isFound = true;
                break;
            }
        }
        if ( !isFound ) {
            cleanedPoints.push( point );
        }
    }
    return cleanedPoints.length;
};

/**
* Append scalars to a X.mesh.
* @param mesh A XTK mesh (X.mesh).
* @param scalars An array of scalars with the same size as the points of the
*   input mesh (ie one scalar per coordinate).
*/
dbv.mesh.appendScalars = function (mesh, scalars) {
    // check sizes
    if ( mesh.points.length !== scalars.length ) {
        var message = 'Scalars and points arrays do not have the same size: ' +
            scalars.length + ' != ' + mesh.points.length;
        throw new Error(message);
    }

    // use local scalars incase we change it
    var xScalars = scalars;
    // scalars min/max
    var range = dbv.math.getArrayMinMax( xScalars );
    // best if scalars are in [0,1] range
    var diff = range.max - range.min;
    if ( range.min !== 0 || range.max !== 1 ) {
        for ( var i = 0; i < xScalars.length; ++i ) {
            xScalars[i] = ( xScalars[i] - range.min ) / diff;
        }
    }
    // append scalars to X.mesh
    mesh.scalars.array = xScalars;
    mesh.scalars.lowerThreshold = 0.0; //range.min;
    mesh.scalars.upperThreshold = 1.0; //range.max;
    mesh.scalars.minColor = [1, 0, 0];
    mesh.scalars.maxColor = [0, 0, 1];
    mesh.modified();
};

/**
* Switch the displayed scalar array.
* @param scalars The scalars to display.
* @param mesh The X.mesh to display the scalars on.
* @param points The points associated to the scalars to display.
*/
dbv.mesh.switchScalars = function (scalars, mesh, points) {
    // filter scalars in case mesh.points and points are not the same
    var scalars2 = dbv.mesh.filterScalars(mesh.points, points, scalars);
    // append the scalars to the X.mesh
    dbv.mesh.appendScalars(mesh, scalars2);
};

/**
* Add shaders to a X.renderer3D.
* @param renderer The renderer to whom to add teh shaders.
*/
dbv.mesh.addShadersToRenderer = function (renderer) {
    var shaders = new X.shaders();
    shaders.vertex = dbv.mesh.getVertexShader('rainbow-5step');
    renderer.addShaders(shaders);
}

/**
* Get a X.mesh from a File or Http source.
* @param source The File or Http source.
* @param fileName The origin file name.
* @param isFileSource Flag to know if the source is from File or Http.
*/
dbv.mesh.getMesh = function (source, fileName, isFileSource) {
    // extract scalar data
    var data = dbv.mesh.parseVtk( source );
    // filter out non scalars|field
    var scalarList = [];
    for ( var i = 0; i < data.scalars.length; ++i ) {
        if ( data.scalars[i].type === 'scalars' ||
            data.scalars[i].type === 'field') {
            scalarList.push( data.scalars[i] );
        }
    }
    // create X.mesh
    var mesh = new X.mesh();
    mesh.file = fileName;
    // mesh default color: grey
    mesh.color = [0.8, 0.8, 0.8];
    // pass the data to the X.mesh
    if ( isFileSource ) {
        mesh.filedata = source;
    }

    var meshCallback = function () {
        if ( scalarList.length != 0 ) {
            var scalars = dbv.mesh.filterScalars(mesh.points, data.points, scalarList[0].data);
            dbv.mesh.appendScalars(mesh, scalars);
        }
    };

    var panelCallback = function (root, renderer) {
        dbv.gui.addMeshPanel(root, mesh, data.points, scalarList, renderer);
    }

    return {'object': mesh,
        'showtimeCallback': meshCallback,
        'panelCallback': panelCallback };
}

/**
* Render mesh files.
* @param renderer The renderer to add to.
* @param files Either a instance of a File or path to the mesh file.
* @param callback A callback function that will be run at the end of the 'onload' function.
* @param gui Optional gui to add panels to.
* @param showtimeListeners Listereners to be run at showtime.
* @param translation A translation to apply to the mesh.
*/
dbv.mesh.render = function (renderer, files, callback, gui, showtimeListeners, translation) {
    // check mesh file
    var isFile = false;
    // yet only support for one file
    var meshFile = files[0];
    var meshFileName;
    if ( typeof(meshFile) === 'undefined' ) {
        var message = 'Please provide a valid file.';
        throw new Error(message);
    }
    else if ( meshFile instanceof File ) {
        meshFileName = meshFile.name;
        isFile = true;
    }
    else {
        meshFileName = meshFile;
    }

    // check extension if file
    if ( !dbv.browser.isLink(meshFileName) ) {
        var extension = meshFileName.split('.').pop();
        if ( extension !== 'vtk' ) {
            var message = 'Unsupported file format: ' + extension;
            throw new Error(message);
        }
    }

    // add the object to the renderer
    if ( isFile ) {
        var reader = new FileReader();
        reader.onload = function (event) {
            // get mesh
            var res;
            try {
                res = dbv.mesh.getMesh( event.target.result, meshFileName, true );
            }
            catch (error) {
                dbv.gui.onError(error.message);
                callback(false);
                this.abort();
                return;
            }
            // the onShowtime method gets executed after all files were fully loaded and
            // just before the first rendering attempt.
            showtimeListeners.add( function () {
                // mesh callback to update scalars: has to be done now since the
                // final mesh points are not set before.
                res.showtimeCallback();
                // create panel
                if ( gui ) {
                    res.panelCallback(gui, this);
                }
                // call input callback
                callback(true);
            });
            // transform
            var mesh = res.object;
            if ( translation ) {
                mesh.transform.translateX( translation.x );
                mesh.transform.translateY( translation.y );
                mesh.transform.translateZ( translation.z );
            }
            renderer.add(mesh);
            renderer.render();
        }
        reader.onerror = function (event) {
            dbv.gui.onError(event.message);
            callback(false);
        }
        reader.readAsArrayBuffer(meshFile);
    }
    else {
        // load
        var request = new XMLHttpRequest();
        request.open('GET', meshFileName, true);
        request.responseType = 'text';
        request.onload = function (/*event*/) {
            // get mesh
            var res;
            try {
                res = dbv.mesh.getMesh( this.response, meshFileName, false );
            }
            catch (error) {
                dbv.gui.onError(error.message);
                callback(false);
                this.abort();
                return;
            }
            // the onShowtime method gets executed after all files were fully loaded and
            // just before the first rendering attempt.
            showtimeListeners.add( function () {
                // mesh callback to update scalars: has to be done now since the
                // final mesh points are not set before.
                res.showtimeCallback();
                // create panel
                if ( gui ) {
                    res.panelCallback(gui, this);
                }
                // call input callback
                callback(true);
            });
            // transform
            var mesh = res.object;
            if ( translation ) {
                mesh.transform.translateX( translation.x );
                mesh.transform.translateY( translation.y );
                mesh.transform.translateZ( translation.z );
            }
            renderer.add(mesh);
            renderer.render();
        };
        request.onerror = function (/*event*/) {
            dbv.gui.onError('Error in XMLHttpRequest, status: '+this.status);
            callback(false);
        }
        request.send(null);
    }
}

/**
* Get local shaders vertex.
*/
dbv.mesh.getVertexShader = function (type) {
    var t0 = '';
    t0 += 'precision mediump float;\n';
    t0 += '\n';
    t0 += 'attribute vec3 vertexPosition;\n';
    t0 += 'attribute vec3 vertexNormal;\n';
    t0 += 'attribute vec3 vertexColor;\n';
    t0 += 'attribute vec2 vertexTexturePos;\n';
    t0 += 'attribute float vertexScalar;\n';
    t0 += '\n';
    t0 += 'uniform mat4 view;\n';
    t0 += 'uniform mat4 perspective;\n';
    t0 += 'uniform vec3 center;\n';
    t0 += 'uniform mat4 objectTransform;\n';
    t0 += 'uniform bool useObjectColor;\n';
    t0 += 'uniform bool useScalars;\n';
    t0 += 'uniform bool scalarsReplaceMode;\n';
    t0 += 'uniform float scalarsMin;\n';
    t0 += 'uniform float scalarsMax;\n';
    t0 += 'uniform vec3 scalarsMinColor;\n';
    t0 += 'uniform vec3 scalarsMaxColor;\n';
    t0 += 'uniform float scalarsMinThreshold;\n';
    t0 += 'uniform float scalarsMaxThreshold;\n';
    t0 += 'uniform int scalarsInterpolation;\n';
    t0 += 'uniform vec3 objectColor;\n';
    t0 += 'uniform float pointSize;\n';
    t0 += '\n';
    t0 += 'varying float fDiscardNow;\n';
    t0 += 'varying vec4 fVertexPosition;\n';
    t0 += 'varying vec3 fragmentColor;\n';
    t0 += 'varying vec2 fragmentTexturePos;\n';
    t0 += 'varying vec3 fVertexNormal;\n';
    t0 += 'varying vec3 fTransformedVertexNormal;\n';

    var t1 = '';
    t1 += '\n';
    t1 += 'void main(void) {\n';
    // setup varying -> fragment shader
    // use the old mat3 constructor to be compatible with mac/safari
    t1 += '  fTransformedVertexNormal = mat3(view[0].xyz,view[1].xyz,view[2].xyz) * ';
    t1 += 'mat3(objectTransform[0].xyz,objectTransform[1].xyz,objectTransform[2].xyz) * ';
    t1 += 'vertexNormal;\n';
    t1 += '  fVertexNormal = vertexNormal;\n';
    t1 += '  fDiscardNow = 0.0;\n'; // don't discard by default
    // t += ' vec4 gVertexPosition = vec4(fVertexPosition.xyz - focus, 1.0);\n';
    t1 += '  vec3 vertexPosition2 = vertexPosition - center;\n';
    t1 += '  fVertexPosition = view * objectTransform * vec4(vertexPosition2, 1.0);\n';
    t1 += '  fragmentTexturePos = vertexTexturePos;\n';
    t1 += '  if (useScalars) {\n'; // use scalar overlays
    t1 += '    float scalarValue = vertexScalar;\n'; // ..and threshold
    t1 += '    if (scalarValue < scalarsMinThreshold || scalarValue > scalarsMaxThreshold) {\n';
    t1 += '      if (scalarsReplaceMode) {\n';
    t1 += '        fragmentColor = objectColor;\n'; // outside threshold
    t1 += '      } else {\n';
    t1 += '        fDiscardNow = 1.0;\n';
    // if we don't replace the colors, just
    // discard this vertex (fiber length
    // thresholding f.e.)
    t1 += '      }\n';
    t1 += '    } else {\n';
    t1 += '      if (scalarsReplaceMode) {\n';

    var t2 = '';
    if ( type === 'mwm' ) {
        t2 += '        vec3 frequency = vec3(0.33, 0.33, 0.33);\n'
        t2 += '        vec3 zeroMaxColor;\n';
        t2 += '        zeroMaxColor[0] = scalarsMaxColor[0]*frequency[0];\n';
        t2 += '        zeroMaxColor[1] = scalarsMaxColor[1]*frequency[1];\n';
        t2 += '        zeroMaxColor[2] = scalarsMaxColor[2]*frequency[2];\n';
        t2 += '        vec3 zeroMinColor;\n';
        t2 += '        zeroMinColor[0] = scalarsMinColor[0]*frequency[0];\n';
        t2 += '        zeroMinColor[1] = scalarsMinColor[1]*frequency[1];\n';
        t2 += '        zeroMinColor[2] = scalarsMinColor[2]*frequency[2];\n';
        t2 += '        vec3 white;\n';
        t2 += '        white[0] = 1.0*frequency[0];\n';
        t2 += '        white[1] = 1.0*frequency[1];\n';
        t2 += '        white[2] = 1.0*frequency[2];\n';
        t2 += '        if(scalarValue > 0.5) {\n';
        t2 += '          fragmentColor = (scalarValue - 0.5) * 2.0 * scalarsMaxColor + (1.0 - scalarValue) * 2.0 * white;\n';
        t2 += '        }\n';
        t2 += '        else {\n';
        t2 += '          fragmentColor = (scalarValue) * 2.0 * white + (0.5 - scalarValue) * 2.0 * scalarsMinColor;\n';
        t2 += '        }\n';
    }
    else if ( type === 'rainbow-sin' ){
        t2 += '        float PI = 3.14159265359;\n'
        t2 += '        vec3 frequency = vec3(PI, 2.0*PI, PI);\n'
        t2 += '        vec3 phase = vec3(0.5*PI, 1.5*PI, 1.5*PI);\n'
        t2 += '        vec3 width = vec3(0.5, 0.5, 0.5);\n'
        t2 += '        vec3 center = vec3(0.5, 0.5, 0.5);\n'
        t2 += '        fragmentColor = sin( scalarValue * frequency + phase ) * width + center;\n';
    }
    else if ( type === 'rainbow-3step' ){
        t2 += '        float red = scalarValue < 0.5 ? -2.0 * scalarValue + 1.0 : 0.0;\n'
        t2 += '        float green = scalarValue < 0.5 ? 2.0 * scalarValue : -2.0 * scalarValue + 2.0;\n'
        t2 += '        float blue = scalarValue < 0.5 ? 0.0 : 2.0 * scalarValue - 1.0;\n'
        t2 += '        fragmentColor = vec3( red, green, blue );\n';
    }
    else if ( type === 'rainbow-5step' ){
        t2 += '        float redInf = scalarValue < 0.25 ? 1.0 : -4.0 * scalarValue + 2.0;\n'
        t2 += '        float redSup = 0.0;\n'
        t2 += '        float red = scalarValue < 0.5 ? redInf : redSup;\n'
        t2 += '        float greenInf = scalarValue < 0.25 ? 4.0 * scalarValue : 1.0;\n'
        t2 += '        float greenSup = scalarValue < 0.75 ? 1.0 : -4.0 * scalarValue + 4.0;\n'
        t2 += '        float green = scalarValue < 0.5 ? greenInf : greenSup;\n'
        t2 += '        float blueInf = 0.0;\n'
        t2 += '        float blueSup = scalarValue < 0.75 ? 4.0 * scalarValue - 2.0 : 1.0;\n'
        t2 += '        float blue = scalarValue < 0.5 ? blueInf : blueSup;\n'
        t2 += '        fragmentColor = vec3( red, green, blue );\n';
    }
    else {
        throw new Error('Unknown color map: ' + type);
    }

    var t3 = '';
    t3 += '      } else {\n';
    t3 += '        fragmentColor = vertexColor;\n';
    t3 += '      }\n';
    t3 += '    }\n';
    t3 += '  } else if (useObjectColor) {\n';
    t3 += '    fragmentColor = objectColor;\n';
    t3 += '  } else {\n';
    t3 += '    fragmentColor = vertexColor;\n';
    t3 += '  }\n';
    // setup vertex Point Size and Position in the GL context
    t3 += '  gl_PointSize = pointSize;\n';
    t3 += '  gl_Position = perspective * fVertexPosition;\n';
    t3 += '}\n';
    return t0 + t1 + t2 + t3;
}
