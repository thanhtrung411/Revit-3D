import * as IFC from 'web-ifc';
import wasmUrl from 'web-ifc/web-ifc.wasm?url';

self.onmessage = async ({ data }) => {
  const api = new IFC.IfcAPI();
  let model;
  try {
    await api.Init(() => new URL(wasmUrl, self.location.href).href, true);
    model = api.OpenModel(new Uint8Array(data.buffer), { COORDINATE_TO_ORIGIN: true });
    if (model < 0) throw new Error('File không có mô hình IFC hợp lệ.');
    const lines = type => {
      const ids = api.GetLineIDsWithType(model, type);
      const result = [];
      for (let i = 0; i < ids.size(); i++) result.push(api.GetLine(model, ids.get(i)));
      return result;
    };
    const floors = lines(IFC.IFCBUILDINGSTOREY).map(f => ({
      id: f.expressID, name: f.Name?.value || `Tầng #${f.expressID}`, elevation: f.Elevation?.value ?? 0,
    })).sort((a, b) => a.elevation - b.elevation);
    const parents = new Map();
    for (const relation of lines(IFC.IFCRELCONTAINEDINSPATIALSTRUCTURE)) {
      for (const child of relation.RelatedElements || []) parents.set(child.value, relation.RelatingStructure.value);
    }
    for (const relation of lines(IFC.IFCRELAGGREGATES)) {
      for (const child of relation.RelatedObjects || []) parents.set(child.value, relation.RelatingObject.value);
    }
    const floorIds = new Set(floors.map(f => f.id));
    const floorOf = id => {
      const seen = new Set();
      while (id !== undefined && !seen.has(id)) {
        if (floorIds.has(id)) return id;
        seen.add(id);
        id = parents.get(id);
      }
      return null;
    };
    self.postMessage({ type: 'floors', floors });
    let count = 0;
    api.StreamAllMeshes(model, (flat, index, total) => {
      const element = api.GetLine(model, flat.expressID);
      const category = api.GetNameFromTypeCode(element.type);
      const meshes = [];
      const transfers = [];
      for (let i = 0; i < flat.geometries.size(); i++) {
        const placed = flat.geometries.get(i);
        const geo = api.GetGeometry(model, placed.geometryExpressID);
        const vertices = api.GetVertexArray(geo.GetVertexData(), geo.GetVertexDataSize()).slice();
        const indices = api.GetIndexArray(geo.GetIndexData(), geo.GetIndexDataSize()).slice();
        meshes.push({ vertices, indices, matrix: Array.from(placed.flatTransformation) });
        transfers.push(vertices.buffer, indices.buffer);
        geo.delete();
      }
      count += meshes.length;
      self.postMessage({ type: 'mesh', id: flat.expressID, name: element.Name?.value || category,
        category, floor: floorOf(flat.expressID), meshes,
        progress: Math.round((index + 1) / total * 100) }, transfers);
    });
    if (!count) throw new Error('Không tìm thấy hình học 3D trong file IFC này.');
    self.postMessage({ type: 'done', count });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || 'Không thể đọc file IFC.' });
  } finally {
    if (model !== undefined && model >= 0) api.CloseModel(model);
  }
};
