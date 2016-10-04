import fs from 'fs'
import THREE from 'three'
import through from 'through2'

export default function (object, cb) {
  const log = through()
  const s = through()
  const file = fs.createWriteStream(object.name,'utf8')
  const vector = new THREE.Vector3()
  const normalMatrixWorld = new THREE.Matrix3()

  s.pipe(file)

  file.on('end', () => { console.log('exported'); })

  if (object instanceof THREE.Mesh) {
    const geometry = object.geometry
    const matrixWorld = object.matrixWorld

    if( geometry instanceof THREE.Geometry) {
      var vertices = geometry.vertices
      var faces = geometry.faces
      normalMatrixWorld.getNormalMatrix(matrixWorld)

      for ( var i = 0, l = faces.length; i < l; i ++ ) {
        var face = faces[i]
        vector.copy(face.normal)
              .applyMatrix3(normalMatrixWorld)
              .normalize()

        s.write('\tfacet normal '+vector.x+' '+vector.y+' '+vector.z+'\n'
               +'\t\touter loop\n')

        var indices = [ face.a, face.b, face.c ]

        for ( var j = 0; j < 3; j ++ ) {
          vector.copy(vertices[indices[j]]).applyMatrix4(matrixWorld)
          s.write('\t\t\tvertex '+vector.x+' '+vector.y+' '+vector.z+'\n')
        }

        s.write('\t\tendloop\n\tendfacet\n')
        // log.write(i+'/'+(faces.length-1)+'\n')
        console.log(i+'/'+(faces.length-1)+'\n')
      }
    }
    s.write('endsolid exported\n')
    s.end()
  }
  cb(log)
}
