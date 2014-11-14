dbv
===

Volume/mesh database visualisation. Using a locally modified version of XTK, see https://github.com/ivmartel/X.

XTK notes
---------
XTK official release files can be found at: http://get.goXTK.com. They are: 'xtk.js', 'xtk_xdat.gui.js' and the latest 'xtk_edge.js'.

To run from a local version:
 * download and uncompress [xtk-master](https://github.com/xtk/X/archive/master.zip) in a 'X' folder
 * download and uncompress [google-closure-library](https://github.com/google/closure-library/archive/master.zip) in 'X/lib'
 * In your HTML:
 ```html
<script type='text/javascript' src='../ext/X/lib/google-closure-library/closure/goog/base.js'></script>
<script type='text/javascript' src='../ext/X/xtk-deps.js'></script>
<script type='text/javascript'>
goog.require('X.renderer3D');
goog.require('X.scalars');
goog.require('X.mesh');
// ...
</script>
```

If you add new files, you need to rebuild the xtk-deps.js:
 * cd X/utils
 * Replace _core/_depsgenerator.py#L55 by 'command = [sys.executable, config.CLOSUREDEPSWRITER_PATH]'
 * Run: `python deps.py`
 * Replace '\' by '/' in xtk-deps.js

To build the compressed xtk.js:
 * cd X/utils
 * Run: `python build.py`
