-------------------------
Safe-PLAI XTK demo data
-------------------------

The mesh files need to contain normals. With Paraview:
 * Load 'shape.vtk'
 * Paraview > Filters > 'Generate Surface Normals' (with or without 'Flip Normals')
 * Set the 'Feature Angle' to 0
 * Apply
 * Save using vtk ASCII format, for example as 'shape-wn.vtk'
