import _ from 'underscore'
import through from 'through2'

const s = through()

const menu = document.querySelector('ul.menu')

_.each(menu.children,(c) => {
  const action = c.id
  const submenu = c.querySelector('ul')
  
  if (submenu) {
    _.each(c.children, (el) => {
      if (el.tagName !== 'UL') 
        el.addEventListener('click', toggle, false)
    })
    _.each(submenu.children, (el) => {el.addEventListener('click',handler,false)})
  } else { 
    c.addEventListener('click',handler,false)
  }
})

function handler (e) {
  const action = e.target.parentElement.id
  if (!action) return
  s.write(action)
}

function toggle (e) {
  const submenu = e.target.parentElement.querySelector('ul')
  if (submenu.tagName !== 'UL') return
  if (submenu.style.display === 'block') 
    submenu.style.display = 'none'
  else submenu.style.display = 'block'
}

export default s
