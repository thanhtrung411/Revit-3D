import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createDemo } from './demo.js';
import { wallOpacity, floorOffset, kindOf, slabDisplayFloor } from './model-logic.js';
import './style.css';
import './viewer-theme.css';
import { createSky } from './sky.js';

const $ = selector => document.querySelector(selector);
const assetBase = import.meta.env.BASE_URL;
const palette = { wall: 0xffffff, floor: 0xd8c1a3, glass: 0x5d9bb5, furniture: 0xd9b770, stair: 0xa6a3a0, structure: 0xa6a9ad, roof: 0x737982 };
const swatch = kind => new THREE.Color(palette[kind]).getHexString();
$('#app').innerHTML = `
<header>
  <div class="brand"><button class="panel-toggle" aria-label="Điều khiển" aria-expanded="false" aria-controls="sidebar">☰</button><span class="brand-mark" aria-hidden="true">✳</span><strong>KHÔNG GIAN</strong><span class="viewer-label">3D Viewer</span></div>
  <div class="file-identity"><span id="filename">7112026.ifc</span><span class="render-status" id="render-status">Đang mở</span></div>
  <nav class="toolbar" aria-label="Chế độ xem">
    <div class="mode-buttons"><button data-mode="orbit" class="active" aria-pressed="true">◉ <span>Xoay</span></button><button data-mode="explode" aria-pressed="false">▱ <span>Tách tầng</span></button><button data-mode="section" aria-pressed="false">◫ <span>Mặt cắt</span></button></div>
    <details class="view-menu"><summary>Góc nhìn <span>⌄</span></summary><div><button data-view="perspective">Phối cảnh</button><button data-view="top">Mặt bằng</button><button data-view="front">Mặt đứng</button></div></details>
    <button class="settings-button" aria-expanded="false" aria-controls="sidebar">Công cụ ⌄</button><button class="primary" id="import">Mở file IFC</button>
  </nav>
</header>
<div class="workspace">
  <aside id="sidebar">
    <div class="drawer-heading"><div><p class="project-number">Mô hình kiến trúc</p><h1>7112026</h1></div><button class="drawer-close" aria-label="Đóng bảng điều khiển">×</button></div><span class="status" id="status">Đang đọc mô hình IFC</span>
    <div class="section mode-controls"><h2 class="section-title">Điều chỉnh không gian</h2>
    <div class="control" id="explode-control" hidden><label class="range-label" for="explode">Khoảng cách tách <output id="explode-value">55%</output></label><input id="explode" type="range" min="0" max="100" value="55"><p class="hint">Kéo để nâng các tầng lên, giữ nguyên vị trí theo mặt bằng.</p></div>
    <div class="control" id="section-control" hidden><label class="range-label" for="section">Cao độ mặt cắt <output id="section-value">55%</output></label><input id="section" type="range" min="0" max="100" value="55"><p class="hint">Ẩn phần nằm phía trên mặt cắt. Bề mặt bị cắt không được bịt kín.</p></div></div>
    <div class="section"><h2 class="section-title">Nhìn xuyên không gian</h2><label class="toggle-row" for="auto-fade">Tường mờ dần khi zoom <input id="auto-fade" type="checkbox" checked></label><label class="range-label">Độ hiện của tường <output id="opacity">100%</output></label><p class="hint">Lại gần để thấy nội thất. Zoom ra để khôi phục lớp vỏ công trình.</p><label class="toggle-row" for="roof">Hiện mái <input id="roof" type="checkbox" checked></label><label class="toggle-row" for="grid">Lưới mặt đất <input id="grid" type="checkbox" checked></label><label class="toggle-row" for="sky">Nền trời <input id="sky" type="checkbox" checked></label></div>
    <div class="section"><h2 class="section-title">Các tầng <button id="all-floors" class="muted-button">Hiện tất cả</button></h2><div id="floors"><p class="hint">Danh sách sẽ hiện sau khi nạp mô hình.</p></div></div>
    <div class="section"><h2 class="section-title">Bảng màu cấu kiện</h2><div class="legend"><span><i style="background:#${swatch('wall')}"></i>Tường</span><span><i style="background:#${swatch('floor')}"></i>Sàn</span><span><i style="background:#${swatch('glass')}"></i>Kính</span><span><i style="background:linear-gradient(90deg,#257389 50%,#f6df70 50%)"></i>Nội thất</span><span><i style="background:#${swatch('stair')}"></i>Cầu thang</span><span><i style="background:#${swatch('structure')}"></i>Kết cấu</span></div></div>
    <button class="secondary" id="help">Hướng dẫn sử dụng</button>
  </aside>
  <main class="stage">
    <div id="viewport" tabindex="0" role="region" aria-label="Khung xem mô hình 3D. Phím mũi tên để xoay, cộng trừ để zoom, H để về góc ban đầu."></div>
    <div class="stage-top"><div><div class="view-title" id="view-title">Không gian chờ khám phá</div><div class="view-subtitle" id="view-subtitle">Xoay tự do. Đi sâu vào từng tầng.</div></div><span class="model-badge" id="model-badge">Chưa nạp mô hình 3D</span></div>
    <div class="tools" aria-label="Điều khiển góc nhìn"><button id="zoom-in" title="Phóng to (+)" aria-label="Phóng to">＋</button><button id="zoom-out" title="Thu nhỏ (-)" aria-label="Thu nhỏ">−</button><button id="home" title="Góc nhìn ban đầu (H)" aria-label="Góc nhìn ban đầu">⌂</button><button id="fullscreen" class="small-icon" title="Toàn màn hình" aria-label="Toàn màn hình">⛶</button></div>
    <div class="empty" id="empty"><div class="empty-card"><div class="preview-wrap"><img src="${assetBase}revit-preview.png" alt="Ảnh xem trước được trích từ file Revit 7112026"></div><h2>Khám phá công trình của bạn.</h2><p>Đang mở <strong>7112026.ifc</strong>.<br>Bạn cũng có thể mở một mô hình IFC khác từ thiết bị.</p><div class="empty-actions"><button class="primary" id="empty-import">Mở bản IFC</button><button class="secondary" id="demo">Thử mô hình mẫu</button></div><small>Mô hình mẫu chỉ để thử thao tác, không phải file của bạn.</small><button class="text-link" id="empty-help">Hướng dẫn sử dụng</button></div></div>
    <div class="orientation" id="orientation" hidden><span class="axis-y">Y</span><span class="axis-z">Z</span><span class="axis-x">X</span><span class="axis-center"></span></div>
    <div class="floating-note" id="selection" hidden></div>
    <div class="bottom-bar"><span id="metrics">7112026.ifc · Đang đọc hình học</span></div><div class="navigation-hint">Kéo để xoay <b>·</b> Cuộn để zoom <b>·</b> Chuột phải để di chuyển</div>
    <button id="download" class="download-button" disabled>↓ <span>Tải IFC</span></button>
    <div id="loading" class="loading" hidden><span id="loading-text">Đang đọc hình học IFC…</span><progress id="progress" max="100" value="0"></progress><button class="secondary" id="cancel">Hủy nạp file</button></div>
    <div class="toast" id="toast" role="alert" hidden></div>
  </main>
</div>
<input id="file" type="file" accept=".ifc" hidden>
<dialog id="help-dialog"><h2>Khám phá không gian 3D</h2><p>Trang tự mở <strong>7112026.ifc</strong>, được xuất từ công trình Revit của bạn.</p><ol><li><strong>Xoay:</strong> kéo chuột để xoay, cuộn để zoom, chuột phải để di chuyển. Tường mờ dần và nội thất hiện ra khi lại gần.</li><li><strong>Tách tầng:</strong> nâng các tầng theo chiều đứng. Chỉnh khoảng cách trong bảng Công cụ.</li><li><strong>Mặt cắt:</strong> kéo thanh cao độ để xem phần công trình bên dưới mặt cắt.</li><li><strong>Công cụ:</strong> ẩn từng tầng, đổi nền trời và lưới. Click vào cấu kiện để xem tên.</li></ol><p>Cảm ứng: một ngón để xoay, hai ngón để zoom/di chuyển. Khi khung 3D được chọn, phím mũi tên để xoay, +/− để zoom, H để về góc ban đầu.</p><p>File IFC khác được xử lý ngay trong trình duyệt. Nút Tải IFC tải mô hình nguồn đang xem.</p><div class="dialog-bottom"><button class="primary" id="close-help">Đã hiểu</button></div></dialog>`;

const scene = new THREE.Scene();
const viewport = $('#viewport');
const camera = new THREE.PerspectiveCamera(38, 1, .02, 10000);
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
catch { $('#empty p').textContent = 'Trình duyệt chưa bật WebGL. Hãy bật tăng tốc đồ họa hoặc dùng Chrome/Edge để xem mô hình 3D.'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setAnimationLoop(render);
viewport.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = !matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.dampingFactor = .09;
controls.maxPolarAngle = Math.PI * .94;
camera.position.set(25, 21, 29);
controls.target.set(0, 4, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x999eab, 2.25));
const sun = new THREE.DirectionalLight(0xfffaf3, 1.35);
sun.position.set(-20, 35, 20); scene.add(sun);
const fill = new THREE.DirectionalLight(0xe7efff, .45);fill.position.set(20, 8, -15);scene.add(fill);
const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const grid = new THREE.GridHelper(100, 50, 0x33435a, 0x46566c);
grid.position.y = -.05; grid.material.transparent = true; grid.material.opacity = .5; scene.add(grid);
const sky = createSky(); scene.add(sky);
let current = null, pending = null, worker = null, mode = 'orbit', referenceDistance = 45, spacing = 5;
let animating = false, toastTimer, loadToken = 0;
let lastTime = 0;
let sourceFile = null;

function newModel() { return { root: new THREE.Group(), groups: new Map(), meshes: [], materials: new Map(), outlineMaterials: new Map(), floors: [], count: 0, triangles: 0 }; }
function groupFor(model, floor) {
  if (!model.groups.has(floor)) { const group = new THREE.Group(); group.userData.floor = floor; model.groups.set(floor, group); model.root.add(group); }
  return model.groups.get(floor);
}
function addGeometry(model, geometry, matrix, floor, category, name, id, ifcColor) {
  const kind = kindOf(category, name);
  if (!model.materials.has(kind)) {
    model.materials.set(kind, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, side: THREE.DoubleSide, transparent: true }));
    model.outlineMaterials.set(kind, new THREE.LineBasicMaterial({ color: 0x252a30, transparent: true, depthWrite: false }));
  }
  const color = new THREE.Color(palette[kind]);
  const isWall = kind === 'wall' && /^IFCWALL/i.test(category);
  if (ifcColor && !isWall && kind !== 'floor' && kind !== 'glass') {
    color.setRGB(ifcColor[0], ifcColor[1], ifcColor[2], THREE.SRGBColorSpace);
  }
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(geometry, model.materials.get(kind));
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), model.outlineMaterials.get(kind));
  outline.renderOrder = 1;
  mesh.add(outline);
  mesh.applyMatrix4(matrix); mesh.userData = { floor, category, name, id, kind };
  groupFor(model, floor).add(mesh);model.meshes.push(mesh);model.count++;model.triangles += (geometry.index?.count || geometry.attributes.position.count) / 3;
}
function dispose(model) {
  if (!model) return;
  scene.remove(model.root);
  for (const mesh of model.meshes) {
    mesh.geometry.dispose();
    mesh.children[0].geometry.dispose();
  }
  model.materials.forEach(mat => mat.dispose());
  model.outlineMaterials.forEach(mat => mat.dispose());
}
function groupSlabsWithSupportedFloor(model) {
  model.root.updateMatrixWorld(true);
  const wallBases = [];
  for (const [id, group] of model.groups) {
    if (id === null) continue;
    const bases = group.children.filter(m => /IFCWALL/i.test(m.userData.category)).map(m => new THREE.Box3().setFromObject(m).min.y).sort((a,b) => a-b);
    if (bases.length) wallBases.push({ id, base: bases[Math.floor(bases.length / 2)] });
  }
  let corrected = 0;
  for (const mesh of model.meshes) {
    if (mesh.userData.kind !== 'floor') continue;
    const box = new THREE.Box3().setFromObject(mesh);
    const floor = slabDisplayFloor(mesh.userData.floor, box.max.y, box.max.y - box.min.y, wallBases);
    if (floor !== mesh.userData.floor) { mesh.userData.sourceFloor = mesh.userData.floor;mesh.userData.floor = floor;groupFor(model, floor).add(mesh);corrected++; }
  }
  model.correctedSlabs = corrected;
}
function install(model, title, isDemo = false) {
  if (!isDemo) groupSlabsWithSupportedFloor(model);
  // Keep the exposed top floor furnished even at the overview zoom distance.
  const topFloor = model.floors.at(-1)?.id;
  if (topFloor !== undefined && model.materials.has('furniture')) {
    const topFurniture = model.materials.get('furniture').clone();
    const topOutline = model.outlineMaterials.get('furniture').clone();
    model.materials.set('furniture-top', topFurniture);
    model.outlineMaterials.set('furniture-top', topOutline);
    for (const mesh of model.meshes) {
      if (mesh.userData.kind === 'furniture' && mesh.userData.floor === topFloor) {
        mesh.material = topFurniture;
        mesh.children[0].material = topOutline;
      }
    }
  }
  dispose(current);current = model;
  current.isDemo = isDemo;
  scene.add(model.root);
  const bounds = new THREE.Box3().setFromObject(model.root);
  const center = bounds.getCenter(new THREE.Vector3());
  model.root.position.set(-center.x, -bounds.min.y, -center.z);
  model.size = bounds.getSize(new THREE.Vector3());
  model.radius = model.size.length() / 2;
  sky.scale.setScalar(Math.max(1, model.radius / 10));
  referenceDistance = model.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.15;
  spacing = Math.max(model.size.y / Math.max(model.floors.length, 1), model.size.x * .3, 1) * 2;
  const ordered = new Map(model.floors.map((f, i) => [f.id, i]));
  for (const [id, group] of model.groups) group.userData.index = ordered.get(id) ?? 0;
  grid.scale.setScalar(Math.max(model.size.x, model.size.z) / 32);
  camera.near = Math.max(.001, model.radius / 3000);camera.far = Math.max(1000, model.radius * 100);camera.updateProjectionMatrix();
  controls.minDistance = model.radius * .08;controls.maxDistance = referenceDistance * 4;
  $('#empty').hidden = true;$('#orientation').hidden = false;
  $('#model-badge').textContent = isDemo ? 'Mô hình mẫu · Không phải file RVT' : title;
  $('#status').textContent = isDemo ? 'Đang xem mô hình mẫu' : 'Đã nạp hình học IFC';
  $('#render-status').textContent = isDemo ? 'Mẫu thử' : 'Đã dựng 3D';
  $('#filename').textContent = title;
  $('#download').disabled = !sourceFile || isDemo;
  $('#roof').closest('label').hidden = !model.materials.has('roof');
  $('#view-subtitle').textContent = isDemo ? 'Dùng để thử thao tác, không phải hình học 7112026.rvt.' : 'Mô hình IFC được xử lý trên thiết bị của bạn.';
  $('#metrics').textContent = `${title}  ·  ${model.floors.length} tầng  ·  ${model.triangles.toLocaleString('vi-VN')} tam giác`;
  $('#floors').replaceChildren();
  const listed = [...model.floors];
  if (model.groups.has(null)) listed.push({ id: null, name: 'Chưa gán tầng' });
  for (const floor of listed) {
    const row = document.createElement('label');row.className = 'floor-row';
    const check = document.createElement('input');check.type = 'checkbox';check.checked = true;
    check.onchange = () => { const group = model.groups.get(floor.id);if (group) group.visible = check.checked; };
    row.append(check, document.createTextNode(floor.name));$('#floors').append(row);
  }
  if (!model.floors.length) notify('File thiếu thông tin tầng. Có thể xoay, zoom và cắt; tách tầng cần IFC có BuildingStorey.');
  setMode('orbit');resetView();setReady(true);
}
function setReady(ready) {
  for (const el of document.querySelectorAll('[data-mode], [data-view], #zoom-in, #zoom-out, #home, #auto-fade, #roof, #all-floors, #explode, #section')) el.disabled = !ready;
  if (ready) $('[data-mode="explode"]').disabled = current.floors.length < 2;
}
function setMode(next) {
  mode = next;
  document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('active', b.dataset.mode === mode);b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
  $('#explode-control').hidden = mode !== 'explode';$('#section-control').hidden = mode !== 'section';
  $('.mode-controls').hidden = mode === 'orbit';
  if (mode !== 'orbit') setPanel(true);
  $('#view-title').textContent = { orbit: 'Góc nhìn tổng thể', explode: 'Khám phá từng tầng', section: 'Đi sâu vào công trình' }[mode];
  if (current) {
    const planes = mode === 'section' ? [clippingPlane] : [];
    for (const mat of [...current.materials.values(), ...current.outlineMaterials.values()]) {
      mat.clippingPlanes = planes;
      mat.needsUpdate = true;
    }
  }
  $('#selection').hidden = true;
  if (current) resetView();
}
function desiredHeight() {
  return current.size.y + (mode === 'explode' ? floorOffset(Math.max(current.floors.length - 1, 0), Number($('#explode').value) / 100, spacing) : 0);
}
function resetView(view = 'perspective') {
  if (!current) return;
  const height = desiredHeight();const target = new THREE.Vector3(0, height / 2, 0);
  const radius = new THREE.Vector3(current.size.x, height, current.size.z).length() / 2;
  const vFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const fov = Math.min(vFov, Math.atan(Math.tan(vFov) * camera.aspect));
  const distance = radius / Math.sin(fov) * 1.12;
  const direction = view === 'top' ? new THREE.Vector3(0, 1, .0001) : view === 'front' ? new THREE.Vector3(0, .04, 1) : new THREE.Vector3(1.05, .85, 1.3);
  controls.target.copy(target);camera.position.copy(target).add(direction.normalize().multiplyScalar(distance));controls.update();
}
function zoom(factor) {
  const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
  offset.clampLength(controls.minDistance, controls.maxDistance);
  camera.position.copy(controls.target).add(offset);controls.update();
}
function render(time) {
  const dt = Math.min((time - lastTime) / 1000, .1);lastTime = time;
  if (!controls) return;
  controls.update();
  sky.position.copy(camera.position);
  sky.visible = $('#sky').checked;
  grid.visible = $('#grid').checked;
  if (current) {
    const scale = mode === 'explode' ? desiredHeight() / current.size.y : 1;
    const opacity = wallOpacity(camera.position.distanceTo(controls.target), referenceDistance * Math.max(1, scale * .65), $('#auto-fade').checked);
    $('#opacity').value = `${Math.round(opacity * 100)}%`;
    viewport.dataset.wallOpacity = opacity.toFixed(3);
    for (const [kind, mat] of current.materials) {
      const shell = ['wall', 'glass', 'roof'].includes(kind);
      mat.opacity = shell ? opacity * (kind === 'glass' ? .4 : 1) : kind === 'furniture' && mode === 'orbit' ? 1 - THREE.MathUtils.smoothstep(opacity, .75, 1) : 1;
      mat.depthWrite = mat.opacity > .98;mat.visible = mat.opacity > .005;
      if (kind === 'roof' && (!$('#roof').checked || mode === 'explode')) mat.visible = false;
      const outline = current.outlineMaterials.get(kind);
      outline.opacity = mat.opacity * .52;
      outline.visible = mat.visible;
    }
    const amount = mode === 'explode' ? Number($('#explode').value) / 100 : 0;
    animating = false;
    for (const group of current.groups.values()) {
      const target = floorOffset(group.userData.index, amount, spacing);
      const difference = target - group.position.y;
      if (Math.abs(difference) > .001) animating = true;
      group.position.y = controls.enableDamping ? group.position.y + difference * (1 - Math.exp(-10 * dt)) : target;
    }
    clippingPlane.constant = Number($('#section').value) / 100 * current.size.y;
  }
  renderer.render(scene, camera);
}
new ResizeObserver(() => { const { width, height } = viewport.getBoundingClientRect();camera.aspect = width / height;camera.updateProjectionMatrix();renderer.setSize(width, height); }).observe(viewport);
function notify(message) { clearTimeout(toastTimer);$('#toast').textContent = message;$('#toast').hidden = false;toastTimer = setTimeout(() => $('#toast').hidden = true, 12000); }
function cancelLoad() { loadToken++;worker?.terminate();worker = null;dispose(pending);pending = null;$('#loading').hidden = true;$('#import').disabled = false; }
async function openFile(file) {
  if (!file) return;
  if (!/\.ifc$/i.test(file.name)) { notify('Cần file .ifc xuất từ Revit. File .rvt chưa thể mở trực tiếp trong web này.');return; }
  if (file.size > 200 * 1024 * 1024) { notify('File lớn hơn 200 MB. Hãy xuất các tầng hoặc bộ môn cần xem thành IFC nhỏ hơn.');return; }
  cancelLoad();const token = loadToken;
  $('#loading').hidden = false;$('#import').disabled = true;$('#progress').value = 0;$('#loading-text').textContent = 'Đang đọc hình học IFC…';
  try {
    const buffer = await file.arrayBuffer();if (token !== loadToken) return;
    pending = newModel();
    worker = new Worker(new URL('./ifc.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (token !== loadToken) return;
      try {
        if (data.type === 'floors') pending.floors = data.floors;
        if (data.type === 'mesh') {
          for (const part of data.meshes) {
            const geometry = new THREE.BufferGeometry();
            const interleaved = new THREE.InterleavedBuffer(part.vertices, 6);
            geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(interleaved, 3, 0));
            geometry.setAttribute('normal', new THREE.InterleavedBufferAttribute(interleaved, 3, 3));
            geometry.setIndex(new THREE.BufferAttribute(part.indices, 1));
            addGeometry(pending, geometry, new THREE.Matrix4().fromArray(part.matrix), data.floor, data.category, data.name, data.id, part.color);
          }
          $('#progress').value = data.progress;$('#loading-text').textContent = `Đang dựng mô hình… ${data.progress}%`;
        }
        if (data.type === 'done') { const model = pending;pending = null;sourceFile = file;cancelLoad();install(model, file.name); }
        if (data.type === 'error') throw new Error(data.message);
      } catch (error) { cancelLoad();notify(`Chưa mở được IFC: ${error.message}`); }
    };
    worker.onerror = () => { cancelLoad();notify('Bộ đọc IFC gặp lỗi. Hãy thử tải lại trang hoặc xuất lại IFC4 từ Revit.'); };
    worker.postMessage({ buffer }, [buffer]);
  } catch (error) { cancelLoad();notify(`Không đọc được file: ${error.message}`); }
}
$('#demo').onclick = () => {
  const model = newModel();model.floors = createDemo((...args) => addGeometry(model, ...args));
  install(model, 'Mô hình mẫu', true);
};
for (const id of ['#import', '#empty-import']) $(id).onclick = () => { $('#file').value = '';$('#file').click(); };
$('#file').onchange = e => openFile(e.target.files[0]);
$('#cancel').onclick = cancelLoad;
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { resetView(b.dataset.view);$('.view-menu').open = false; });
$('#explode').oninput = () => { $('#explode-value').value = `${$('#explode').value}%`; };
$('#section').oninput = () => { $('#section-value').value = `${$('#section').value}%`; };
$('#zoom-in').onclick = () => zoom(.8);$('#zoom-out').onclick = () => zoom(1.25);$('#home').onclick = () => resetView();
$('#all-floors').onclick = () => { for (const g of current.groups.values()) g.visible = true;document.querySelectorAll('#floors input').forEach(c => c.checked = true); };
$('#fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen();else await $('.stage').requestFullscreen(); } catch { notify('Trình duyệt hiện tại chưa cho phép toàn màn hình.'); } };
for (const id of ['#help', '#empty-help']) $(id).onclick = () => $('#help-dialog').showModal();
$('#close-help').onclick = () => $('#help-dialog').close();
function setPanel(open) { document.body.classList.toggle('panel-open', open);document.querySelectorAll('.panel-toggle,.settings-button').forEach(b => b.setAttribute('aria-expanded', String(open))); }
document.querySelectorAll('.panel-toggle,.settings-button').forEach(b => b.onclick = () => setPanel(!document.body.classList.contains('panel-open')));
$('.drawer-close').onclick = () => setPanel(false);
$('#download').onclick = () => { if (!sourceFile) return;const url = URL.createObjectURL(sourceFile);const a = document.createElement('a');a.href = url;a.download = sourceFile.name;a.click();setTimeout(() => URL.revokeObjectURL(url), 1000); };
viewport.addEventListener('keydown', event => {
  if (!current) return;
  if (['+', '=', '-', 'h', 'H', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  if (['+', '='].includes(event.key)) zoom(.85);
  if (event.key === '-') zoom(1.18);
  if (event.key.toLowerCase() === 'h') resetView();
  if (event.key.startsWith('Arrow')) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta += event.key === 'ArrowLeft' ? .12 : event.key === 'ArrowRight' ? -.12 : 0;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + (event.key === 'ArrowUp' ? -.12 : event.key === 'ArrowDown' ? .12 : 0), .01, Math.PI * .94);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();
  }
});
let pointerStart;
renderer.domElement.addEventListener('pointerdown', e => { pointerStart = [e.clientX, e.clientY];viewport.focus({ preventScroll: true }); });
renderer.domElement.addEventListener('pointerup', e => {
  if (!current || !pointerStart || e.button !== 0 || Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]) > 5) return;
  const rect = renderer.domElement.getBoundingClientRect();const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
  const hit = ray.intersectObjects(current.meshes, false).find(hit => hit.object.parent.visible && hit.object.material.visible && (mode !== 'section' || hit.point.y <= clippingPlane.constant));
  if (!hit) { $('#selection').hidden = true;return; }
  const { name, category, floor } = hit.object.userData;
  const title = document.createElement('strong');title.textContent = current.floors.find(f => f.id === floor)?.name || 'Chưa gán tầng';
  $('#selection').replaceChildren(title, document.createTextNode(`${name} · ${category}`));$('#selection').hidden = false;
});
$('.stage').addEventListener('dragover', e => e.preventDefault());
$('.stage').addEventListener('drop', e => { e.preventDefault();openFile(e.dataTransfer.files[0]); });
setReady(false);
$('.mode-controls').hidden = true;
async function loadDefaultModel() {
  try {
    const response = await fetch(`${assetBase}7112026.ifc`);
    if (!response.ok) throw new Error('Không tìm thấy file 7112026.ifc.');
    const blob = await response.blob();
    // A manual file selection or cancellation takes precedence over auto-loading.
    if (current || worker || loadToken !== 0) return;
    await openFile(new File([blob], '7112026.ifc'));
  } catch (error) { $('#render-status').textContent = 'Chưa nạp';notify(error.message); }
}
loadDefaultModel();
if (import.meta.env.DEV) window.viewerDiagnostics = () => ({ model: !!current, demo: current?.isDemo, meshes: current?.count, floors: current?.floors.length, mode, wallOpacity: Number(viewport.dataset.wallOpacity), offsets: current ? Array.from(current.groups.values(), g => g.position.y) : [], clipping: clippingPlane.constant, animating, furnitureOpacity: current?.materials.get('furniture')?.opacity, visibleFloors: current ? Array.from(current.groups.values(), g => g.visible) : [] });
