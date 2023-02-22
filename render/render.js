// const title = {
//   tag: 'button',
//   props: {
//     onClick: () => alert('h'),
//   },
//   children: 'click me',
// }
const myComponent = () => {
  return {
    tag: 'button',
    props: {
      onClick: () => alert('h'),
    },
    children: 'click me',
  }
}
const vnode = {
  tag: myComponent,
}

const mountElement = (vnode, container) => {
  const { tag, props, children } = vnode
  const el = document.createElement(tag)
  for (const key in props) {
    if (/^on/.test(key)) {
      el.addEventListener(key.slice(2).toLowerCase(), props[key]) // 参数分别为事件类型(名称)和事件处理函数
    }
  }

  if (typeof children === 'string') {
    el.textContent = children
  } else if (Array.isArray(children)) {
    children.forEach((child) => renderer(child, el))
  }

  container.appendChild(el)
}

const mountComponent = (vnode, container) => {
  const subtree = vnode.tag()
  renderer(subtree, container)
}

const renderer = (vnode, container) => {
  if (typeof vnode.tag === 'string') {
    // 说明是标签元素
    mountElement(vnode, container)
  } else if (typeof vnode.tag === 'function') {
    // 说明是组件
    mountComponent(vnode, container)
  } else {
  }
}

renderer(vnode, document.body)
