import _ from 'underscore'
import through from 'through2'

const s = through()
const menu = document.querySelector('ul.menu')
const settings = document.querySelector('ul.settingsMenu').children

function click (e) {
  const action = e.target.parentElement.id
  if (!action) return
  s.write(action)
}

//SETTINGS MENU
_.each(settings, (el) => {
  const input = el.querySelector('input')
  input.addEventListener('change', (e) => {
    const val = e.target.value
    const name = e.target.className
    s.write(name+':'+val)
  })
})

//TOOLS MENUS
_.each(menu.children,(c) => {
  const submenu = c.querySelector('ul')
  if (!submenu) return
  _.each(submenu.children, (el) => {el.addEventListener('click', click, false)})
})

export default s
