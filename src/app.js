import ndarray from 'ndarray'
import proc from 'child_process'
import getPix from 'get-pixels'
import jimp from 'jimp'
import floyd from 'floyd-steinberg'
import stl from './index.js'
import p from '../node_modules/paper/dist/paper-core.js'
import fs from 'fs'
import _ from 'underscore'
const PNG = require('pngjs-nozlib').PNG
const ipc = require('electron').ipcRenderer

ipc.on('data', (event, arg) => {
  console.log(event,arg)
})

ipc.send('data','vorple')


// contain components in a single hash
// menu items disabled/enabled toggle
// handle menu items (use text to make api calls)
// how to do sub-menus?

let mask = false
let raster = false
let group = false
let bg = false
let image = false
let printBed = false

const fileDir = fs.realpathSync(__dirname).replace('/dist','/files/')
const cvs = document.getElementById('cvs')

cvs.width = window.innerWidth
cvs.height = window.innerHeight

const ctx = cvs.getContext('2d')

const tinkerine = {
  pixel: 0.65,
  width: 215,
  height: 160
}

p.setup(cvs)

function drawPrintBed (dim) {
  const gutter = 30 // in mm
  const w = parseInt((dim.width-gutter)/dim.pixel)
  const h = parseInt((dim.height-gutter)/dim.pixel)

  const bed = new p.Shape.Rectangle({
    fillColor: 'rgba(255,255,255,0.2)',
    strokeColor: 'black',
    strokeWidth: 0.75,
    point: [200,40],
    size: [w,h]
  })

  const wLabel = new p.PointText({
    content: w,
    fontFamily: 'apercu',
    fillColor:'black',
    fontSize: '12px',
    point: [0,0]
  })
  wLabel.position.x = bed.bounds.center.x 
  wLabel.position.y = 
    bed.bounds.center.y + (bed.bounds.height*0.5) + 8

  const wLeft = new p.Path.Line(
    [bed.bounds.center.x - (bed.bounds.width/2), wLabel.bounds.center.y
    ],[
     bed.bounds.center.x - (wLabel.bounds.width/2) - 4, wLabel.bounds.center.y
  ])
  wLeft.strokeColor = 'black'
  wLeft.strokeWidth = 0.75

  const wRight = wLeft.clone()
  wRight.position.x+=((wLabel.bounds.width)+8+(wLeft.bounds.width))

  console.log(wRight.segments)

  const hLabel = wLabel.clone()
  hLabel.content= h
  hLabel.position.x = wRight.segments[1].point.x+(hLabel.bounds.width/2)+4
  hLabel.position.y = bed.bounds.center.y

  const hTop = new p.Path.Line({
    from: [hLabel.position.x - (hLabel.bounds.width/2)+4,40],
    to: [hLabel.position.x-(hLabel.bounds.width/2)+4,hLabel.position.y-8],
    strokeColor: 'black',
    strokeWidth: 0.75
  })
  const hBot = hTop.clone()
  hBot.position.y += hBot.bounds.height + hLabel.bounds.height + 2

  p.view.draw()

  console.log(wRight)

  // const wDim = new p.Group({

  // })
  
  // const hDim = new p.Group({

  // })
}

drawPrintBed(tinkerine)

p.view.draw()

// color seperation!!!
// make a button toolbar

const events = {
  crop : (e) => {
    e.preventDefault()
    if (!group) return
    // paperjs glitching :(
    // use mask bounds to crop! image.crop()
    image.crop(mask.bounds.x,mask.bounds.y,mask.bounds.width,mask.bounds.height)
    raster.setImageData(image.bitmap.data,image.bitmap.width,image.bitmap.height)
    raster.name = group.children[1].name
    group.remove()  
    bg.remove()
    p.view.draw()
  },
  esc : (e) => {
    if (mask.visible) mask.visible = false
    p.view.draw()
  },
  dither : (e) => {
    const dith = floyd(raster.getImageData(),raster.width,raster.height)
    raster.setImageData(dith,new p.Point(0,0))
    p.view.draw()
  },
  convert : (e) => {
    // write image file!
    // write using jimp and spawn convert
  }
}

window.addEventListener('keydown', (e) => {
  if (e.keyCode===13) events.crop(e)
  if (e.keyCode===27) events.esc(e)
  if (e.keyCode===32) events.dither(e)
  if (e.keyCode===13&&e.ctrlKey) events.convert(e)
}, false)

function canvasMouseDown (e) { // draw crop window
  if (!raster) return 

   mask = new p.Path.Rectangle({
    name : 'selection',
    fillColor : 'black',
    strokeColor : 'black',
    point : [100, 100],
    size : [1, 1],
    visible : false
  })

  bg = raster.clone()
  bg.opacity = 0.3

  mask.fillColor = 'black'
  mask.visible = true
  mask.opacity = 1
  mask.strokeColor = 'rgba(0,0,0,0)'
  mask.bringToFront()
  group = new p.Group(mask,raster)
  group.children[0].clipMask = true

  const c0 = [e.clientX, e.clientY] 
  window.onmousemove = (ev) => {
    const c3 = [ev.clientX, ev.clientY]
    const c1 = [(c3[0] - c0[0]) + c0[0], c0[1]]
    const c2 = [c0[0], (c3[1] - c0[1]) + c0[1]]
    mask.segments = [c0, c2, c3, c1]
    p.view.draw()
  }
}

function canvasMouseUp (e) { p.view.draw() }

// draw printer bed in window
window.onmouseup = (e) => { window.onmousemove = null }
cvs.addEventListener('mousedown', canvasMouseDown, false)
cvs.addEventListener('mouseup', canvasMouseUp, false)

cvs.addEventListener('drop', (e) => {
  e.preventDefault()

  const file = e.dataTransfer.files[0]
  if (!file) return

  console.log(file.path)

  jimp.read(file.path, (e, i) => {
    if (e) console.error(e)
    image = i
    const w = i.bitmap.width
    const h = i.bitmap.height
    // const dith = floyd(p,p.shape[0],p.shape[1])
    const data = Uint8ClampedArray.from(i.bitmap.data)
    const img = new ImageData(data,w,h)
    if (raster&&raster.remove) raster.remove()
    raster = new p.Raster({size:[w,h]})
    raster.name = file.name
    raster.setImageData(img,new p.Point(0,0))
    raster.position = printBed.bounds.center
    printBed.bringToFront()
    p.view.draw()
  })

  // getPix(file.path, (e,pix) => { // load pixels to canvas
  //   if (e) console.error(e)
  //   const w = pix.shape[0]
  //   const h = pix.shape[1]
  //   // const dith = floyd(p,p.shape[0],p.shape[1])
  //   const data = Uint8ClampedArray.from(pix.data)
  //   const img = new ImageData(data,w,h)
  //   console.log(img)
  //   if (raster&&raster.remove) raster.remove()
  //   raster = new p.Raster({size:[w,h]})
  //   raster.name = file.name
  //   raster.setImageData(img,new p.Point(0,0))
  //   raster.position = p.view.center
  //   p.view.draw()
  // })
}, false)

cvs.addEventListener('dragover', (e) => { e.preventDefault(); return false })

function convert (filepath, cb) {
  console.log('converting '+filepath)
  const bin = fs.realpathSync(__dirname).replace('/dist','/') 
              + 'node_modules/imageToStl/bin/imageToStl.js'

  const toStl = proc.spawn(bin,[filepath])
  toStl.stdout.on('data', (d) => {
    console.log(d.toString())
  })
  toStl.stderr.on('data', (d) => {
    console.log(d.toString())
  })
  toStl.on('close', () => {
    console.log('converted')
  })
}
