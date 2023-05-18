import * as THREE from 'three';

const vertexShader = /* glsl */ `
    uniform vec4 data;
    uniform vec3 color;

    varying vec4 vData;
    varying vec3 vColor;
    

    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.xyz *= data.xyz;

        vData = data;
        vColor = color;
    }
`;

const fragmentShader = /* glsl */ `
    in vec4 vData;
    in vec3 vColor;


    void main() {
        vec4 normalizedData = normalize(vData);
        gl_FragColor = vec4(vColor, 1.0);
        gl_FragColor = mix(gl_FragColor, vData, vData.w);
    }
`;

const script_container = document.getElementById('demo-container');

const width = script_container.clientWidth || window.innerWidth;
const height = script_container.clientHeight || window.innerHeight * 0.8;


const createUI = (audioSources, container, onChangeCallback) => {

    container.style.zIndex = '9999';
  
    const label = document.createElement('label');
    label.textContent = 'Audio Input: ';
    container.appendChild(label);
  
    const select = document.createElement('select');
    select.addEventListener('change', (event) => {
      const selectedSource = audioSources[event.target.value];
      onChangeCallback(selectedSource);
    });
  
    for (let i = 0; i < audioSources.length; i++) {
      const option = document.createElement('option');
      option.value = i;
      console.log(audioSources[i]);
      option.textContent = audioSources[i].label || `Source ${i + 1}`;
      select.appendChild(option);
    }
  
    container.appendChild(select);
  };

let analyser, selectedSource, stream;



const setupAudio = async (selectedSource) => {

    let stream = null;

    analyser = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: selectedSource.deviceId } } })
        .then((s) => {
            stream = s;
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 32;

            source.connect(analyser);

            return analyser;
        })
        .catch((err) => {
            console.log(err);
        });

    return analyser;
};

const getMaterial = (baseColor) => {
    const material = new THREE.ShaderMaterial({
        uniforms: {
            data: { value: new THREE.Vector4(1, 1, 1, 1) },
            color: { value: baseColor || new THREE.Vector3(1, 1, 1) },
        },
        vertexShader,
        fragmentShader,
    });
    return material;
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3d0079);
const camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});

script_container.appendChild(renderer.domElement);

console.log(await navigator.mediaDevices.enumerateDevices());

renderer.setSize(width, height);


navigator.mediaDevices.getUserMedia({ audio: true })

const audioSources = await navigator.mediaDevices.enumerateDevices()
    .then((devices) => devices.filter((device) => device.kind === 'audioinput'))
    .catch((err) => {
    console.log(err);
    return [];
});

selectedSource = audioSources[0];


createUI(audioSources, script_container, (selected) => {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }

    selectedSource = selected;

    setupAudio(selectedSource);
});

setupAudio(selectedSource);


const material1 = getMaterial(new THREE.Color(0xffab00));
const geometry = new THREE.BoxGeometry();
const cube = new THREE.Mesh(geometry, material1);
cube.scale.x = 2;
scene.add(cube);

const material2 = getMaterial(new THREE.Color(0xb319ab));
const geometry2 = new THREE.BoxGeometry();
const cube2 = new THREE.Mesh(geometry2, material2);
cube2.position.x = 2;
cube2.scale.y = 2;
scene.add(cube2);

const material3 = getMaterial(new THREE.Color(0xb319ab));
const geometry3 = new THREE.BoxGeometry();
const cube3 = new THREE.Mesh(geometry3, material3);
cube3.position.x = -2;
cube3.scale.y = 2;
scene.add(cube3);

const material4 = getMaterial(new THREE.Color(0xffab00));
const geometry4 = new THREE.BoxGeometry();
const cube4 = new THREE.Mesh(geometry4, material4);
cube4.position.y = 2;
cube4.scale.x = 2;
scene.add(cube4);

const material5 = getMaterial(new THREE.Color(0xffab00));
const geometry5 = new THREE.BoxGeometry();
const cube5 = new THREE.Mesh(geometry5, material5);
cube5.position.y = -2;
cube5.scale.x = 2;
scene.add(cube5);


camera.position.z = 3;

let fftData = new Uint8Array(16);
let smootedFFTData = new Float32Array(16);

const animate = function () {
    requestAnimationFrame(animate);
    
    //cube.rotation.x += 0.01;
    //cube.rotation.y += 0.01;
    if (analyser) {

        analyser.getByteFrequencyData(fftData);
        let floatData = Float32Array.from(fftData);
        floatData = floatData.map((d) => d / 127.5 - 1);

        for (let i = 0; i < floatData.length; i++) {
            smootedFFTData[i] = smootedFFTData[i] * 0.9 + floatData[i] * 0.1;
        }

        floatData = smootedFFTData;

        material1.uniforms.data.value = new THREE.Vector4(floatData[0], floatData[1], floatData[2], floatData[3]);
        material2.uniforms.data.value = new THREE.Vector4(floatData[3], floatData[4], floatData[5], floatData[6]);
        material3.uniforms.data.value = new THREE.Vector4(floatData[6], floatData[7], floatData[8], floatData[9]);
        material4.uniforms.data.value = new THREE.Vector4(floatData[9], floatData[10], floatData[11], floatData[12]);
        material5.uniforms.data.value = new THREE.Vector4(floatData[12], floatData[13], floatData[14], floatData[15]);
    }
    
    renderer.render(scene, camera);


};

animate();
