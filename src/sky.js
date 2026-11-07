import * as THREE from 'three';

export function createSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vDirection;
      void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vDirection;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(7.1,3.5);a*=0.5;}return s;}
      void main(){
        vec3 d=normalize(vDirection); float h=clamp(d.y*0.65+0.6,0.0,1.0);
        vec3 color=mix(vec3(0.80,0.81,0.78),vec3(0.29,0.47,0.67),h);
        vec2 uv=vec2(atan(d.z,d.x)*2.3,d.y*6.0)+vec2(4.0,8.0);
        float clouds=smoothstep(0.46,0.72,fbm(uv));
        color=mix(color,vec3(0.96,0.96,0.94),clouds*0.85);
        vec3 ground=mix(vec3(0.13,0.21,0.33),vec3(0.035,0.065,0.12),clamp(-d.y,0.0,1.0));
        color=mix(color,ground,smoothstep(0.02,0.36,-d.y));
        gl_FragColor=vec4(color,1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 20), material);
  mesh.frustumCulled = false;mesh.renderOrder = -100;
  return mesh;
}
