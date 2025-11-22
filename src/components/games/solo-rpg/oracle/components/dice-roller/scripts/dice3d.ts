import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type DieType = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export interface DieConfig {
    color: number;
    labelColor: number;
    size: number;
    d4FontSize: number;
    d6FontSize: number;
    d8FontSize: number;
    d10FontSize: number;
    d12FontSize: number;
    d20FontSize: number;
    d100FontSize: number;
    fontSize: number;
}

const DEFAULT_CONFIG: DieConfig = {
    color: 0xff4444,
    labelColor: 0xffffff,
    size: 1,
    d4FontSize: 100,
    d6FontSize: 200,
    d8FontSize: 100,
    d10FontSize: 100,
    d12FontSize: 100,
    d20FontSize: 80,
    d100FontSize: 100,
    fontSize: 100
};

// Geometry cache
const geometries: Record<string, THREE.BufferGeometry> = {};
const materials: Record<string, THREE.Material[]> = {};
const shapes: Record<string, CANNON.Shape> = {};

// Helper to create text texture
function createTextTexture(text: string, color: string, bgColor: string, fontSize: DieType): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 256, 256);

    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `bold ${getFontSizeForDiceType(fontSize, DEFAULT_CONFIG)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;

    // Move text down further to visually center it better
    // Previous was 148. User says 160 is too low. Reverting to 148.
    ctx.fillText(text, 128, 148);

    if (['6', '9'].includes(text)) {
        ctx.fillText('.', 128, 148 + fontSize * 0.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Helper for D4 texture (3 numbers)
function createD4Texture(top: string, left: string, right: string, color: string, bgColor: string, baseFontSize: number): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 256, 256);

    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 0;

    const fontSize = baseFontSize * 0.6; // Scale down for D4
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;

    // Calculated positions along medians (50% from vertex to centroid)
    // Top Vertex (128, 25) -> Centroid (128, 162). Pos: (128, 93)
    // Left Vertex (25, 230) -> Centroid. Pos: (76, 196)
    // Right Vertex (230, 230) -> Centroid. Pos: (179, 196)

    // Top Number (Upright)
    ctx.save();
    ctx.translate(128, 93);
    ctx.fillText(top, 0, 0);
    ctx.restore();

    // Left Number (Rotated 150 deg to face Left Vertex)
    // Rotation: 240 deg (from previous) seemed correct for orientation.
    // Let's keep rotation, just update position.
    ctx.save();
    ctx.translate(76, 196);
    ctx.rotate(240 * Math.PI / 180);
    ctx.fillText(left, 0, 0);
    ctx.restore();

    // Right Number (Rotated 210 deg? No, 120 deg)
    ctx.save();
    ctx.translate(179, 196);
    ctx.rotate(120 * Math.PI / 180);
    ctx.fillText(right, 0, 0);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function getFontSizeForDiceType(type: DieType, config: DieConfig): number {
    switch (type) {
        case 4: return config.d4FontSize;
        case 6: return config.d6FontSize;
        case 8: return config.d8FontSize;
        case 10: return config.d10FontSize;
        case 12: return config.d12FontSize;
        case 20: return config.d20FontSize;
        case 100: return config.d100FontSize;
    }
}

function getMaterials(type: DieType, config: DieConfig): THREE.Material[] {
    const key = `${type}-${config.color}-${config.labelColor}-${getFontSizeForDiceType(type, config)}`;
    if (materials[key]) return materials[key];

    const mats: THREE.Material[] = [];
    const colorHex = '#' + config.color.toString(16).padStart(6, '0');
    const labelColorHex = '#' + config.labelColor.toString(16).padStart(6, '0');

    if (type === 4) {
        const faces = [
            ['1', '2', '3'],
            ['1', '4', '2'],
            ['1', '3', '4'],
            ['2', '4', '3']
        ];

        faces.forEach(nums => {
            mats.push(new THREE.MeshPhongMaterial({
                map: createD4Texture(nums[0], nums[1], nums[2], labelColorHex, colorHex, config.d4FontSize),
                color: 0xffffff,
                shininess: 30,
                flatShading: true
            }));
        });

    } else {
        let labels: string[] = [];

        if (type === 6) labels = ['1', '2', '3', '4', '5', '6'];
        else if (type === 8) labels = ['1', '2', '3', '4', '5', '6', '7', '8'];
        else if (type === 10) labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
        else if (type === 12) labels = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
        else if (type === 20) labels = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
        else if (type === 100) labels = ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90'];

        labels.forEach(label => {
            mats.push(new THREE.MeshPhongMaterial({
                map: createTextTexture(label, labelColorHex, colorHex, type),
                color: 0xffffff,
                shininess: 30,
                flatShading: true
            }));
        });
    }

    materials[key] = mats;
    return mats;
}

function applyUVsAndGroups(geometry: THREE.BufferGeometry, type: DieType) {
    const pos = geometry.getAttribute('position');
    const count = pos.count;

    geometry.clearGroups();

    const uvArray = new Float32Array(count * 2);

    // UVs for Polyhedrons
    // Top(0.5, 0.9), BL(0.15, 0.25), BR(0.85, 0.25)
    const uvsPoly = [
        0.5, 0.9, // Top
        0.15, 0.25, // Bottom Left
        0.85, 0.25  // Bottom Right
    ];

    // D4 UVs
    const uvsD4 = [
        0.5, 0.9,  // Top Vertex
        0.1, 0.1,  // Left Vertex
        0.9, 0.1   // Right Vertex
    ];

    if (type === 6) {
        const materialIndices = [0, 5, 1, 4, 2, 3];
        for (let i = 0; i < 6; i++) {
            geometry.addGroup(i * 6, 6, materialIndices[i]);
        }
        return;
    } else if (type === 4) {
        const numFaces = count / 3;
        for (let i = 0; i < numFaces; i++) {
            for (let j = 0; j < 3; j++) {
                uvArray[(i * 3 + j) * 2] = uvsD4[j * 2];
                uvArray[(i * 3 + j) * 2 + 1] = uvsD4[j * 2 + 1];
            }
            geometry.addGroup(i * 3, 3, i);
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
        return;
    } else if (type === 12) {
        // Dodecahedron: 12 faces, 3 triangles each (usually) -> 9 vertices per face.
        // Total vertices = 12 * 9 = 108.
        // We need to generate UVs for each pentagonal face.
        // Planar projection for each face.

        const numFaces = 12;
        const vertsPerFace = 9; // 3 triangles

        for (let i = 0; i < numFaces; i++) {
            const start = i * vertsPerFace;

            // Calculate Face Normal (using first triangle)
            const v1 = new THREE.Vector3().fromBufferAttribute(pos, start);
            const v2 = new THREE.Vector3().fromBufferAttribute(pos, start + 1);
            const v3 = new THREE.Vector3().fromBufferAttribute(pos, start + 2);
            const normal = new THREE.Vector3().subVectors(v2, v1).cross(new THREE.Vector3().subVectors(v3, v1)).normalize();

            // Calculate Up and Right vectors for projection
            let up = new THREE.Vector3(0, 1, 0);
            if (Math.abs(normal.y) > 0.9) up = new THREE.Vector3(0, 0, 1);
            const right = new THREE.Vector3().crossVectors(normal, up).normalize();
            up.crossVectors(right, normal).normalize();

            // Project vertices
            for (let j = 0; j < vertsPerFace; j++) {
                const v = new THREE.Vector3().fromBufferAttribute(pos, start + j);

                // Project to 2D plane relative to center of face?
                // We need the center of the face.
                // Let's just project and normalize.

                const x = v.dot(right);
                const y = v.dot(up);

                // We need to map these x,y to 0..1 UV space.
                // Dodecahedron face size?
                // We can find min/max X/Y for this face and scale.
                // But we do this per vertex, so we need to know the bounds beforehand or do two passes.
                // Since it's a regular dodecahedron, the bounds are constant relative to center.
                // Distance from center to vertex is roughly constant.
                // Let's assume center is (0,0) in projected space (if we subtract face center).
                // But we didn't calculate face center.

                // Simpler: Just use the raw projection and scale/offset.
                // For a unit dodecahedron, face radius is approx...
                // Let's just do a quick min/max search for this face? No, expensive.
                // Hardcode scale?
                // Vertices are roughly 0.5 to 1.0 apart.
                // Let's try scaling by 0.8 and offsetting by 0.5.

                uvArray[(start + j) * 2] = 0.5 - x * 0.8;
                uvArray[(start + j) * 2 + 1] = 0.5 + y * 0.8;
            }

            geometry.addGroup(start, vertsPerFace, i);
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
        return;
    }

    const numFaces = count / 3;

    for (let i = 0; i < numFaces; i++) {
        for (let j = 0; j < 3; j++) {
            uvArray[(i * 3 + j) * 2] = uvsPoly[j * 2];
            uvArray[(i * 3 + j) * 2 + 1] = uvsPoly[j * 2 + 1];
        }

        let matIndex = i;
        if (type === 10 || type === 100) {
            matIndex = i % 10;
        }
        // D12 handled above

        geometry.addGroup(i * 3, 3, matIndex);
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
}

function getGeometry(type: DieType, size: number): THREE.BufferGeometry {
    const key = `${type}-${size}`;
    if (geometries[key]) return geometries[key].clone();

    let geometry: THREE.BufferGeometry;

    switch (type) {
        case 4: geometry = new THREE.TetrahedronGeometry(size); break;
        case 6: geometry = new THREE.BoxGeometry(size, size, size); break;
        case 8: geometry = new THREE.OctahedronGeometry(size); break;
        case 10:
        case 100: geometry = new THREE.IcosahedronGeometry(size); break;
        case 12: geometry = new THREE.DodecahedronGeometry(size); break;
        case 20: geometry = new THREE.IcosahedronGeometry(size); break;
        default: geometry = new THREE.BoxGeometry(size, size, size);
    }

    geometry = geometry.toNonIndexed();

    if (type === 4) {
        // ... (D4 logic unchanged)
        const pos = geometry.getAttribute('position');
        const uniqueVerts: { x: number, y: number, z: number, id: number }[] = [];

        for (let i = 0; i < pos.count; i++) {
            const v = { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) };
            if (!uniqueVerts.some(uv => Math.abs(uv.x - v.x) < 0.01 && Math.abs(uv.y - v.y) < 0.01 && Math.abs(uv.z - v.z) < 0.01)) {
                uniqueVerts.push({ ...v, id: 0 });
            }
        }

        uniqueVerts.sort((a, b) => b.y - a.y);
        uniqueVerts.forEach((v, i) => v.id = (i + 1));

        const newPos = [];
        const newUVs = [];
        const newGroups = [];

        const targetFaces = [
            { verts: [1, 2, 3], mat: 0 },
            { verts: [1, 4, 2], mat: 1 },
            { verts: [1, 3, 4], mat: 2 },
            { verts: [2, 4, 3], mat: 3 }
        ];

        const getV = (id: number) => uniqueVerts.find(v => v.id == id);

        targetFaces.forEach(tf => {
            const vA = getV(tf.verts[0]);
            const vB = getV(tf.verts[1]);
            const vC = getV(tf.verts[2]);

            if (vA && vB && vC) {
                newPos.push(vA.x, vA.y, vA.z);
                newPos.push(vB.x, vB.y, vB.z);
                newPos.push(vC.x, vC.y, vC.z);

                newUVs.push(0.5, 0.9);
                newUVs.push(0.1, 0.1);
                newUVs.push(0.9, 0.1);

                newGroups.push({ start: newGroups.length * 3, count: 3, mat: tf.mat });
            }
        });

        const newGeo = new THREE.BufferGeometry();
        newGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3));
        newGeo.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2));
        newGroups.forEach(g => newGeo.addGroup(g.start, g.count, g.mat));
        newGeo.computeVertexNormals();

        geometries[key] = newGeo;
        return newGeo;
    }

    applyUVsAndGroups(geometry, type);
    geometry.computeVertexNormals();

    geometries[key] = geometry;
    return geometry;
}

function getPhysicsShape(type: DieType, size: number): CANNON.Shape {
    const key = `${type}-${size}`;
    if (shapes[key]) return shapes[key];

    let shape: CANNON.Shape;

    if (type === 6) {
        const halfExtents = new CANNON.Vec3(size / 2, size / 2, size / 2);
        shape = new CANNON.Box(halfExtents);
    } else {
        const geometry = getGeometry(type, size);
        const posAttr = geometry.getAttribute('position');
        const vertices: CANNON.Vec3[] = [];
        const faces: number[][] = [];

        const tolerance = 0.001;
        const uniqueVertices: THREE.Vector3[] = [];

        for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
            let found = false;
            for (let j = 0; j < uniqueVertices.length; j++) {
                if (uniqueVertices[j].distanceToSquared(v) < tolerance) {
                    found = true;
                    break;
                }
            }
            if (!found) uniqueVertices.push(v);
        }

        uniqueVertices.forEach(v => vertices.push(new CANNON.Vec3(v.x, v.y, v.z)));

        for (let i = 0; i < posAttr.count; i += 3) {
            const face: number[] = [];
            for (let j = 0; j < 3; j++) {
                const v = new THREE.Vector3().fromBufferAttribute(posAttr, i + j);
                let index = -1;
                for (let k = 0; k < uniqueVertices.length; k++) {
                    if (uniqueVertices[k].distanceToSquared(v) < tolerance) {
                        index = k;
                        break;
                    }
                }
                if (index !== -1) face.push(index);
            }
            faces.push(face);
        }

        shape = new CANNON.ConvexPolyhedron({ vertices, faces });
    }

    shapes[key] = shape;
    return shape;
}

export function createDie(type: DieType, config: Partial<DieConfig> = {}): THREE.Mesh {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const geometry = getGeometry(type, finalConfig.size);
    const mats = getMaterials(type, finalConfig);

    const mesh = new THREE.Mesh(geometry, mats);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type, ...finalConfig };

    return mesh;
}

export function createDieBody(type: DieType, size: number, position: THREE.Vector3): CANNON.Body {
    const shape = getPhysicsShape(type, size);
    const body = new CANNON.Body({
        mass: 1,
        shape,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        material: new CANNON.Material({ friction: 0.1, restitution: 0.5 })
    });

    body.quaternion.setFromEuler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );

    return body;
}

export function getDieResult(mesh: THREE.Mesh): number {
    const type = mesh.userData.type as DieType;
    const geometry = mesh.geometry;
    const posAttribute = geometry.getAttribute('position');
    const count = posAttribute.count;

    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);

    if (type === 4) {
        // ... (D4 logic unchanged)
        const worldDown = new THREE.Vector3(0, -1, 0);
        let maxDot = -Infinity;
        let bestFaceIndex = -1;

        const numFaces = count / 3;
        for (let i = 0; i < numFaces; i++) {
            const startVertex = i * 3;
            const v1 = new THREE.Vector3().fromBufferAttribute(posAttribute, startVertex);
            const v2 = new THREE.Vector3().fromBufferAttribute(posAttribute, startVertex + 1);
            const v3 = new THREE.Vector3().fromBufferAttribute(posAttribute, startVertex + 2);

            const localNormal = new THREE.Vector3().subVectors(v2, v1).cross(new THREE.Vector3().subVectors(v3, v1)).normalize();
            const worldNormal = localNormal.clone().applyMatrix3(normalMatrix).normalize();

            const dot = worldNormal.dot(worldDown);
            if (dot > maxDot) {
                maxDot = dot;
                bestFaceIndex = i;
            }
        }

        const map = [4, 3, 2, 1];
        return map[bestFaceIndex];
    }

    const worldUp = new THREE.Vector3(0, 1, 0);
    let maxDot = -Infinity;
    let bestFaceIndex = -1;

    // Determine vertices per face for result calculation
    // D6: 6 verts (2 tris)
    // D12: 9 verts (3 tris)
    // Others: 3 verts (1 tri)
    let verticesPerFace = 3;
    if (type === 6) verticesPerFace = 6;
    if (type === 12) verticesPerFace = 9;

    const numFaces = count / verticesPerFace;

    for (let i = 0; i < numFaces; i++) {
        const startVertex = i * verticesPerFace;
        const v1 = new THREE.Vector3().fromBufferAttribute(posAttribute, startVertex);
        const v2 = new THREE.Vector3().fromBufferAttribute(posAttribute, startVertex + 1);
        const v3 = new THREE.Vector3().fromBufferAttribute(posAttribute, startVertex + 2);

        const localNormal = new THREE.Vector3().subVectors(v2, v1).cross(new THREE.Vector3().subVectors(v3, v1)).normalize();
        const worldNormal = localNormal.clone().applyMatrix3(normalMatrix).normalize();

        const dot = worldNormal.dot(worldUp);
        if (dot > maxDot) {
            maxDot = dot;
            bestFaceIndex = i;
        }
    }

    if (type === 6) {
        const map = [1, 6, 2, 5, 3, 4];
        return map[bestFaceIndex];
    } else if (type === 10 || type === 100) {
        let val = (bestFaceIndex % 10) + 1;
        if (type === 100) {
            return (bestFaceIndex % 10) * 10;
        }
        if ((bestFaceIndex % 10) === 9) return 0;
        return (bestFaceIndex % 10) + 1;
    } else {
        // D12 and others (1-based index)
        return bestFaceIndex + 1;
    }
}
