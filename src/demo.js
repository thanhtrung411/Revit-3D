import * as THREE from 'three';

// Illustrative geometry only; this is never presented as the user's RVT geometry.
export function createDemo(add) {
  const floors = [0, 1, 2].map(i => ({ id: i, name: ['Tầng trệt', 'Tầng 1', 'Tầng 2'][i], elevation: i * 3.4 }));
  function box(floor, category, size, position, name) {
    add(new THREE.BoxGeometry(...size), new THREE.Matrix4().makeTranslation(position[0], position[1] + floor * 3.4, position[2]), floor, category, name);
  }
  floors.forEach(({ id: f }) => {
    box(f, 'IFCSLAB', [7, .22, 16], [0, 0, 0], 'Sàn tầng');
    box(f, 'IFCSLAB', [4, .22, 7], [5.5, 0, -4.5], 'Sàn cánh bên');
    box(f, 'IFCWALL', [.18, 2.9, 16], [-3.5, 1.55, 0], 'Tường dọc');
    box(f, 'IFCWALL', [.18, 2.9, 9], [3.5, 1.55, 3.5], 'Tường dọc');
    box(f, 'IFCWALL', [.18, 2.9, 7], [7.5, 1.55, -4.5], 'Tường cánh bên');
    box(f, 'IFCWALL', [11, 2.9, .18], [2, 1.55, -8], 'Tường phía sau');
    box(f, 'IFCWALL', [4, 2.9, .18], [5.5, 1.55, -1], 'Tường cánh bên');
    for (const z of [-3, 2]) box(f, 'IFCWALL', [4.4, 2.9, .12], [-1.3, 1.55, z], 'Vách ngăn phòng');
    box(f, 'IFCWALL', [7, .7, .2], [0, .45, 8], 'Tường chân cửa kính');
    box(f, 'IFCWINDOW', [6.8, 2.1, .08], [0, 1.85, 8], 'Kính mặt tiền');
    for (const x of [-3.4, 0, 3.4]) box(f, 'IFCCOLUMN', [.17, 3, .17], [x, 1.6, 7.9], 'Cột');
    for (const z of [-5.7, -.8, 4.5]) {
      box(f, 'IFCFURNISHINGELEMENT', [2.4, .34, 1.05], [-1.4, .65, z], 'Ghế sofa');
      box(f, 'IFCFURNISHINGELEMENT', [2.4, .65, .22], [-1.4, 1.1, z - .45], 'Lưng ghế');
      box(f, 'IFCFURNISHINGELEMENT', [1.5, .12, .85], [-1.4, .65, z + 1.35], 'Bàn');
      for (const x of [-1.95, -.85]) box(f, 'IFCFURNISHINGELEMENT', [.09, .55, .6], [x, .32, z + 1.35], 'Chân bàn');
    }
    box(f, 'IFCFURNISHINGELEMENT', [1.8, .15, 2.4], [5.3, .8, -4.5], 'Bàn làm việc');
    for (const z of [-5.3, -3.7]) box(f, 'IFCFURNISHINGELEMENT', [.7, .7, .7], [6.6, .5, z], 'Ghế');
    for (let i = 0; i < 16; i++) box(f, 'IFCSTAIR', [1.15, .18, .28], [2.6, .2 + i * .19, -6.7 + i * .28], 'Bậc thang');
  });
  box(2, 'IFCROOF', [7.2, .22, 16.2], [0, 3.15, 0], 'Mái');
  box(2, 'IFCROOF', [4.2, .22, 7.2], [5.5, 3.15, -4.5], 'Mái cánh bên');
  return floors;
}
