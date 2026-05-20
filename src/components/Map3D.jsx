import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { STATUS } from '../data'

// 教室を低ポリの建物として 3D 描画する混雑マップ
function Map3D({ shops, onSelect }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = 440

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#070b18')
    scene.fog = new THREE.Fog('#070b18', 22, 48)

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200)
    camera.position.set(9, 10, 13)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = Math.PI / 2.15
    controls.minDistance = 7
    controls.maxDistance = 32
    controls.target.set(0, 0.6, 0)

    // --- ライト ---
    scene.add(new THREE.AmbientLight('#6b78a8', 1.15))
    const sun = new THREE.DirectionalLight('#ffffff', 1.5)
    sun.position.set(12, 18, 9)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -20
    sun.shadow.camera.right = 20
    sun.shadow.camera.top = 20
    sun.shadow.camera.bottom = -20
    scene.add(sun)
    const rim = new THREE.DirectionalLight('#4f8cff', 0.6)
    rim.position.set(-10, 6, -8)
    scene.add(rim)

    // --- 地面 ---
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: '#0f1730' }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    const grid = new THREE.GridHelper(60, 60, '#243358', '#16203c')
    grid.position.y = 0.01
    scene.add(grid)

    // --- 樹木 ---
    function makeTree(x, z) {
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.6),
        new THREE.MeshStandardMaterial({ color: '#5b3a22' }),
      )
      trunk.position.y = 0.3
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(0.7, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: '#2f9e5e' }),
      )
      leaves.position.y = 1.25
      leaves.castShadow = true
      tree.add(trunk, leaves)
      tree.position.set(x, 0, z)
      return tree
    }
    ;[
      [-9, 6],
      [9, 6],
      [-9, -6],
      [9, -6],
    ].forEach(([x, z]) => scene.add(makeTree(x, z)))

    // --- 建物（教室）---
    const buildings = []
    const cols = Math.min(4, shops.length) || 1
    const spacing = 3.6
    shops.forEach((shop, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const rowCount = Math.ceil(shops.length / cols)
      const x = (col - (cols - 1) / 2) * spacing
      const z = (row - (rowCount - 1) / 2) * spacing
      const h = 1.7
      const color = STATUS[shop.status].color

      const group = new THREE.Group()
      group.position.set(x, 0, z)

      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, h, 2.2),
        new THREE.MeshStandardMaterial({ color }),
      )
      wall.position.y = h / 2
      wall.castShadow = true
      wall.receiveShadow = true
      wall.userData.shop = shop
      group.add(wall)

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.85, 1, 4),
        new THREE.MeshStandardMaterial({ color: '#1c2a4d' }),
      )
      roof.position.y = h + 0.5
      roof.rotation.y = Math.PI / 4
      roof.castShadow = true
      group.add(roof)

      scene.add(group)
      buildings.push(wall)
    })

    // --- クリックで教室を選択 ---
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hovered = null
    function pick(e) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObjects(buildings)[0]
    }
    function onClick(e) {
      const hit = pick(e)
      if (hit && onSelect) onSelect(hit.object.userData.shop)
    }
    function onMove(e) {
      const hit = pick(e)
      const obj = hit ? hit.object : null
      if (hovered !== obj) {
        if (hovered) hovered.scale.set(1, 1, 1)
        hovered = obj
        if (hovered) hovered.scale.set(1.08, 1.08, 1.08)
        renderer.domElement.style.cursor = obj ? 'pointer' : 'grab'
      }
    }
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.addEventListener('pointermove', onMove)

    // --- ループ ---
    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      const w = mount.clientWidth
      camera.aspect = w / height
      camera.updateProjectionMatrix()
      renderer.setSize(w, height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('pointermove', onMove)
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [shops, onSelect])

  return <div className="map3d-canvas" ref={mountRef} />
}

export default Map3D
