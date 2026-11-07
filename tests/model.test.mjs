import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wallOpacity, floorOffset, kindOf, slabDisplayFloor } from '../src/model-logic.js';
import { IfcAPI, IFCBUILDINGSTOREY, IFCRELCONTAINEDINSPATIALSTRUCTURE, IFCWALL, IFCFURNITURE } from 'web-ifc';

test('walls stay faint up close and fade to opaque from afar', () => {
  assert.equal(wallOpacity(10, 100), .18);
  assert.equal(wallOpacity(30, 100), .18);
  assert.ok(Math.abs(wallOpacity(55, 100) - .5) < 1e-10);
  assert.equal(wallOpacity(80, 100), 1);
  assert.equal(wallOpacity(1000, 100), 1);
  let previous = 0;
  for (let d = 0; d <= 120; d++) { const value = wallOpacity(d, 100);assert.ok(value >= previous && value <= 1);previous = value; }
  assert.equal(wallOpacity(10, 100, false), 1);
});
test('7112026 IFC has three floors, furniture, wall categories and complete geometry containment', async () => {
  const api = new IfcAPI();await api.Init();
  const model = api.OpenModel(new Uint8Array(readFileSync('public/7112026.ifc')), { COORDINATE_TO_ORIGIN: true });
  try {
    assert.equal(api.GetLineIDsWithType(model, IFCBUILDINGSTOREY).size(), 3);
    assert.equal(api.GetLineIDsWithType(model, IFCWALL).size(), 46);
    assert.equal(api.GetLineIDsWithType(model, IFCFURNITURE).size(), 109);
    const containment = new Map();const relations = api.GetLineIDsWithType(model, IFCRELCONTAINEDINSPATIALSTRUCTURE);
    for (let i = 0; i < relations.size(); i++) { const relation = api.GetLine(model, relations.get(i));for (const element of relation.RelatedElements) containment.set(element.value, relation.RelatingStructure.value); }
    let triangles = 0, meshes = 0;
    api.StreamAllMeshes(model, flat => {
      assert.ok(containment.has(flat.expressID), `Element ${flat.expressID} must belong to a floor`);
      for (let i = 0; i < flat.geometries.size(); i++) {
        const geometry = api.GetGeometry(model, flat.geometries.get(i).geometryExpressID);
        triangles += geometry.GetIndexDataSize() / 3;meshes++;geometry.delete();
      }
    });
    assert.equal(triangles,174527);assert.equal(meshes,349);
  } finally { api.CloseModel(model); }
});
test('exploding floors keeps the lowest floor fixed and restores every floor at zero', () => {
  assert.equal(floorOffset(0, 1, 5), 0);
  assert.equal(floorOffset(2, .5, 5), 5);
  for (let floor = 0; floor < 20; floor++) assert.equal(floorOffset(floor, 0, 5), 0);
});
test('exported ceiling slabs follow the floor they support without moving unmatched slabs', () => {
  const bases = [{id:24,base:-2.038},{id:26,base:.362},{id:30,base:4.262}];
  assert.equal(slabDisplayFloor(24,.362,.362,bases),26);
  assert.equal(slabDisplayFloor(26,4.262,.362,bases),30);
  assert.equal(slabDisplayFloor(24,-2.038,.15,bases),24);
  assert.equal(slabDisplayFloor(26,7,.15,bases),26);
  assert.equal(slabDisplayFloor(null,.362,.362,bases),null);
  assert.equal(kindOf('IfcPlate','Curtain Panels 319473'),'glass');
});
test('real IFC parser preserves both storeys, containment and nonempty geometry', async () => {
  const api = new IfcAPI();await api.Init();
  const model = api.OpenModel(new Uint8Array(readFileSync('tests/fixtures/two-storeys.ifc')), { COORDINATE_TO_ORIGIN: true });
  try {
    assert.ok(model >= 0);
    assert.equal(api.GetLineIDsWithType(model, IFCBUILDINGSTOREY).size(), 2);
    assert.equal(api.GetLineIDsWithType(model, IFCRELCONTAINEDINSPATIALSTRUCTURE).size(), 2);
    let meshes = 0;let triangles = 0;
    api.StreamAllMeshes(model, flat => {
      const category = api.GetNameFromTypeCode(api.GetLine(model, flat.expressID).type);
      const expected = { IfcWall: 'wall', IfcSlab: 'floor', IfcFurnishingElement: 'furniture' };
      assert.equal(kindOf(category), expected[category]);
      for (let i = 0; i < flat.geometries.size(); i++) {
        const geometry = api.GetGeometry(model, flat.geometries.get(i).geometryExpressID);
        assert.ok(geometry.GetVertexDataSize() > 0);
        triangles += geometry.GetIndexDataSize() / 3;meshes++;geometry.delete();
      }
    });
    assert.equal(meshes, 6);assert.ok(triangles >= 72);
  } finally { api.CloseModel(model); }
});
