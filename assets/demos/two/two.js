import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { setupAudio, createUI, addAudioInputToUI, audioSources } from '/assets/demos/utils.js';


let selectedSource = audioSources[0];

const mixers = [];
let stream, analyser;
const n_bins = 32;

const script_container = document.getElementById('demo-container');
const width = script_container.clientWidth || window.innerWidth;
const height = script_container.clientHeight || window.innerHeight * 0.8;
const gui = createUI(script_container);

    
addAudioInputToUI(audioSources, gui, async (selected) => {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }

    selectedSource = selected;

    [analyser, stream] = await setupAudio(selectedSource, n_bins);
});

[analyser, stream] = await setupAudio(selectedSource, n_bins);

const loader = new GLTFLoader();

const main_scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
//const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000 );
camera.position.set(0, 0, 80);

camera.updateProjectionMatrix();
const light = new THREE.AmbientLight(0x404040); // soft white light
const pointLight = new THREE.PointLight(0xb319ab, 200, 100);
pointLight.lookAt(0, 0, 0);
pointLight.position.set(0, 40, -50);
const pointLight2 = new THREE.PointLight(0x404040, 100, 100);
pointLight2.position.set(0, 40, 50);
pointLight2.lookAt(0, 0, 0);
const pointLight3 = new THREE.PointLight(0x404040, 100, 100);
pointLight3.position.set(-50, 40, 0);
pointLight3.lookAt(0, 0, 0);
main_scene.add(light);
main_scene.add(pointLight);
main_scene.add(pointLight2);
main_scene.add(camera);

main_scene.background = new THREE.Color(0x3d0079);

loader.load(
    // resource URL
    '/assets/demos/two/mannequin.gltf',
    // called when the resource is loaded
    function ( gltf ) {  
        for (let i = 0; i < n_bins / 2; i++) {

            let scene;

            if (i > 0) {
                scene = clone(gltf.scene);
            } else {
                scene = gltf.scene;
            }
            main_scene.add( scene );
            scene.scale.set(100, 100, 100);
            const posx = -60 + i * 7;
            scene.position.set(posx, Math.random() - 10, i * 2* Math.sin(i));
            scene.rotation.set(0, 0, 0);
            scene.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                    //child.material = new THREE.MeshPhongMaterial( { color: 0xaaaaaa } );
                }
            } );
            const mixer = new THREE.AnimationMixer( scene );
            mixers.push( mixer );
            gltf.animations.forEach((clip) => {
                mixer.clipAction( clip ).play();
            });
        }
    },
    // called while loading is progressing
    function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            }
);




const renderer = new THREE.WebGLRenderer();


renderer.setSize(width, height);
script_container.appendChild(renderer.domElement);

let fftData = new Uint8Array(n_bins / 2);
let smoothedData = new Float32Array(n_bins / 2);

var matrix = new THREE.Matrix4();

const animate = () => {

    const delta = 0.1;

    if (analyser) {
        analyser.getByteFrequencyData(fftData);
        let floatData = Float32Array.from(fftData);
        floatData = floatData.map((d) => d / 255);

        smoothedData = smoothedData.map((d, i) => {
            return d * 0.9 + floatData[i] * 0.1;
        });


        mixers.forEach((element, i) => {
            //element.setTime(element.time + smoothedData[i] * delta);
            element.update(smoothedData[i] * delta);
        });
    }

    matrix.makeRotationY(0.0001);
    camera.position.applyMatrix4(matrix);
    camera.lookAt(0, 0, 0);

    requestAnimationFrame(animate);

    renderer.render(main_scene, camera);
}

animate();