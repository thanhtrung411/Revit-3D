import { mkdirSync, writeFileSync } from 'node:fs';
const lines = [];let next = 1;
const entity = text => { const id = next++;lines.push(`#${id}=${text};`);return `#${id}`; };
let guidId = 0;const guid = () => `'${String(++guidId).padStart(22, '0')}'`;
const origin = entity('IFCCARTESIANPOINT((0.,0.,0.))');
const up = entity('IFCDIRECTION((0.,0.,1.))');
const x = entity('IFCDIRECTION((1.,0.,0.))');
const axis = entity(`IFCAXIS2PLACEMENT3D(${origin},${up},${x})`);
const origin2d = entity('IFCCARTESIANPOINT((0.,0.))');
const axis2d = entity(`IFCAXIS2PLACEMENT2D(${origin2d},$)`);
const placement = entity(`IFCLOCALPLACEMENT($,${axis})`);
const context = entity(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-5,${axis},$)`);
const unit = entity('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)');
const units = entity(`IFCUNITASSIGNMENT((${unit}))`);
const project = entity(`IFCPROJECT(${guid()},$,'Integration fixture',$,$,$,$,(${context}),${units})`);
const building = entity(`IFCBUILDING(${guid()},$,'Test building',$,$,${placement},$,$,.ELEMENT.,$,$,$)`);
entity(`IFCRELAGGREGATES(${guid()},$,$,$,${project},(${building}))`);
const storeys = [];
for (let floor = 0; floor < 2; floor++) {
  const point = entity(`IFCCARTESIANPOINT((0.,0.,${floor * 3}.))`);
  const floorAxis = entity(`IFCAXIS2PLACEMENT3D(${point},${up},${x})`);
  const floorPlacement = entity(`IFCLOCALPLACEMENT(${placement},${floorAxis})`);
  const storey = entity(`IFCBUILDINGSTOREY(${guid()},$,'Test floor ${floor}',$,$,${floorPlacement},$,$,.ELEMENT.,${floor * 3}.)`);
  storeys.push(storey);
  const elements = [];
  for (const [type, w, d, h] of [['IFCWALL', 5, .2, 2.8], ['IFCSLAB', 6, 6, .2], ['IFCFURNISHINGELEMENT', 1, 1, .8]]) {
    const profile = entity(`IFCRECTANGLEPROFILEDEF(.AREA.,$,${axis2d},${w}.,${d})`);
    const solid = entity(`IFCEXTRUDEDAREASOLID(${profile},${axis},${up},${h})`);
    const shape = entity(`IFCSHAPEREPRESENTATION(${context},'Body','SweptSolid',(${solid}))`);
    const representation = entity(`IFCPRODUCTDEFINITIONSHAPE($,$,(${shape}))`);
    const args = `${guid()},$,'Test ${type} ${floor}',$,$,${floorPlacement},${representation},$`;
    elements.push(entity(`${type}(${args}${type === 'IFCFURNISHINGELEMENT' ? '' : ',.NOTDEFINED.'})`));
  }
  entity(`IFCRELCONTAINEDINSPATIALSTRUCTURE(${guid()},$,$,$,(${elements.join(',')}),${storey})`);
}
entity(`IFCRELAGGREGATES(${guid()},$,$,$,${building},(${storeys.join(',')}))`);
mkdirSync('tests/fixtures', { recursive: true });
writeFileSync('tests/fixtures/two-storeys.ifc', `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ViewDefinition [DesignTransferView]'),'2;1');\nFILE_NAME('test.ifc','2026-11-07T00:00:00',('Test'),('Test'),'Test','Test','');\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n${lines.join('\n')}\nENDSEC;\nEND-ISO-10303-21;`);
