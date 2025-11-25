export default {
  mounted(el:Element) {
    const text = el.textContent
    const parts = text.split(/(@\w+)/g)
    el.textContent = ''
    //console.log(text);
    parts.forEach(part => {
      if (part.startsWith('@')) {
        const span = document.createElement('span')
        span.textContent = part
        span.classList.add('mention')
        
        el.appendChild(span)
      } else {
        el.appendChild(document.createTextNode(part))
      }
    })
  }
}