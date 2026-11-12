import { synth } from './audio.js';
import { buildLevel } from './level.js';
import { player, resetPlayer, updateSimulation } from './entities.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090c16);
scene.fog = new THREE.FogExp2(0x090c16, 0.015);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const dirLight = new THREE.DirectionalLight(0xffeedd, 0.9);
dirLight.position.set(10, 25, 20);
dirLight.castShadow = true;
scene.add(dirLight);

scene.add(player.mesh);

const input = {
    keys: {},
    mouseDown: false
};

let gameState = 'menu';
let lastTime = performance.now();

window.addEventListener('keydown', e => {
    input.keys[e.code] = true;
    if (e.code === 'KeyM') synth.toggleMute();

    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        const down = input.keys['KeyS'] || input.keys['ArrowDown'];
        if (down && player.onGround && player.y > 1.5) {
            player.y -= 0.35;
            player.onGround = false;
        } else if (player.onGround) {
            player.vy = 13.8;
            player.onGround = false;
            synth.sfxJump();
        }
    }
});

window.addEventListener('keyup', e => { input.keys[e.code] = false; });
window.addEventListener('mousedown', () => { input.mouseDown = true; });
window.addEventListener('mouseup', () => { input.mouseDown = false; });

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function endGame(victory) {
    if (gameState === 'gameover') return;
    gameState = 'gameover';

    const overlay = document.getElementById('overlay');
    const title = document.getElementById('overlay-title');
    const sub = document.getElementById('overlay-sub');
    const btn = document.getElementById('start-btn');

    overlay.style.display = 'flex';
    if (victory) {
        title.innerText = 'МИССИЯ ВЫПОЛНЕНА!';
        title.style.color = '#44ff66';
        sub.innerText = 'БАЗА ОМЕГА УНИЧТОЖЕНА! СЧЕТ: ' + player.score;
        synth.sfxPowerup();
    } else {
        title.innerText = 'GAME OVER';
        title.style.color = '#ff3333';
        sub.innerText = 'ШТУРМ ПРОВАЛЕН. СЧЕТ: ' + player.score;
    }
    btn.innerText = 'СЫГРАТЬ СНОВА';
}

function startGame() {
    synth.init();
    synth.startMusic();
    buildLevel(scene);
    resetPlayer();
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('boss-bar').style.width = '100%';
    gameState = 'playing';
}

document.getElementById('start-btn').addEventListener('click', startGame);

function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === 'playing') {
        updateSimulation(dt, scene, camera, input, endGame);
    }
    renderer.render(scene, camera);
}

buildLevel(scene);
camera.position.set(5, 5, 16);
camera.lookAt(5, 3, 0);
requestAnimationFrame(animate);
