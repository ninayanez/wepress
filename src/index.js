import _ from 'underscore'
import THREE from 'three'
import exp from './export.js'

const MAP = { // front : 8,9 & back : 10,11
  right : 0, // faces 0,1
  left : 2, // faces 2,3
  top : 4, // faces 4,5
  bottom : 6 // faces 6,7
}

const pixelGeo = new THREE.CubeGeometry(1, 1, 1)
const printable = new THREE.Geometry()

export default function (file,p) {
  const w = p.width
  const h = p.height
  const baseGeo = new THREE.CubeGeometry(w,h,4)
  baseGeo.center()

  // fix glitch for screen edges (check for negatives)

  for(let y = 0; y < h; y++) { // y row
    console.log(y+'/'+(h-1))
    for(let x = 0; x < w; x++) { // x across y
      const val = p.data[((w*y)+x)*4]

      // find connected pixels
      /*const sides = { 
        right : (p.data[((w*y)+(x+1))*4] === 0) ? true : false,
        left : (p.data[((w*y)+(x-1))*4] === 0) ? true : false,
        top : (p.data[((w*(y-1))+x)*4] === 0) ? true : false,
        bottom : (p.data[((w*(y+1))+x)*4] === 0) ? true : false
      }*/

      const sides = { // find connected pixels
        right : (p.data[((w*y)+(x+1))*4])
        left : (p.data[((w*y)+(x-1))*4])
        top : (p.data[((w*(y-1))+x)*4])
        bottom : (p.data[((w*(y+1))+x)*4])
      }

      _.each(sides,(v,k) => {
        if (v === 0) sides[k] = true
        else sides[k] = false
      })

      if (val===0) savePixel(x,y,sides)
    }
  }

  printable.scale(1,1,2.5) // ratio???
  printable.center() 
  const base = new THREE.Mesh(baseGeo)
  base.position.z = -2.5 // plus thicknes??
  base.updateMatrix()
  printable.merge(base.geometry, base.matrix)
  const model = new THREE.Mesh(printable)
  model.name = file.split('.')[0] + '.stl'

  exp(model, (log) => {
    log.on('data', (d) => { console.log(d) })
  })

  function savePixel (x,y,sides) {
    const pixel = new THREE.Mesh(pixelGeo.clone())
    let map = _.clone(MAP)
    pixel.position.x = x
    pixel.position.y = -y
    _.each(sides, (v,k) => { // remove colliding side
      if (v===true) { 
        pixel.geometry.faces.splice(map[k],2)
        _.each(map, (face,side) => { // update map since face is removed
          if (face!==k) map[face] = side-2
        }) 
      }
    })
    pixel.updateMatrix()
    printable.merge(pixel.geometry,pixel.matrix)
  }
}
