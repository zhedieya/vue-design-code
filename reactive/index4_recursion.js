// 存储副作用函数的桶
const bucket = new WeakMap()

// 原始数据
const data = { ok: true, text: 'hello world' }
// 对原始数据的代理
const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
    track(target, key)
    // 返回属性值
    return target[key]
  },
  // 拦截设置操作
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal
    // 把副作用函数从桶里取出并执行
    trigger(target, key)
    return true
  },
})

function track(target, key) {
  console.log('track run')
  if (!activeEffect) return // 没有正在执行的副作用函数 直接返回
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  // deps就是与当前副作用函数相关的依赖集合
  deps.add(activeEffect)
  // 将该依赖集合存储到activeEffect.deps中
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  console.log('trigger run')
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set()
  effects &&
    effects.forEach((effectFn) => {
      // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行，防止递归爆栈
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  effectsToRun.forEach((effectFn) => effectFn())
  // effects && effects.forEach(effectFn => effectFn())
}

// 用一个全局变量存储当前激活的 effect 函数
let activeEffect
const effectStack = []

function effect(fn) {
  const effectFn = () => {
    console.log('clean run')
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数时，将副作用函数赋值给 activeEffect
    activeEffect = effectFn
    // 调用前将当前副作用函数压入栈中
    effectStack.push(effectFn)
    fn()
    // 副作用函数执行后，将当前副作用函数从栈中弹出
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  effectFn()
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

let temp1, temp2

effect(function effectFn1() {
  console.log('effectFn1 执行')
  effect(function effectFn2() {
    console.log('effectFn2 执行')
    temp2 = obj.bar
  })
  temp1 = obj.foo
})

setTimeout(() => {
  obj.foo = false
}, 1000)
