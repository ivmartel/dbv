// namespace
var dbv = dbv || {};
dbv.math = dbv.math || {};

/**
* Get the minimum and maximum of an input array.
*/
dbv.math.getArrayMinMax = function ( array ) {
    var min = Infinity;
    var max = -Infinity;
    var value = 0.0;
    for ( var i = 0; i < array.length; ++i ) {
        value = array[i];
        min = Math.min( min, value );
        max = Math.max( max, value );
    }
    return { 'min': min, 'max': max };
};
