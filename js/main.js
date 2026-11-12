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

const input = { keys: {}, mouseDown: false };
let gameState = 'menu';
let lastTime = performance.now();

function triggerJump() {
    if (gameState !== 'playing') return;
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

window.addEventListener('keydown', e => {
    input.keys[e.code] = true;
    if (e.code === 'KeyM') synth.toggleMute();
    if (e.code === 'Space') {
        e.preventDefault();
        triggerJump();
    }
});

window.addEventListener('keyup', e => { input.keys[e.code] = false; });

document.querySelectorAll('.t-btn').forEach(btn => {
    const code = btn.getAttribute('data-key');

    const press = e => {
        e.preventDefault();
        btn.classList.add('active');
        input.keys[code] = true;
        if (code === 'Space') triggerJump();
    };

    const release = e => {
        e.preventDefault();
        btn.classList.remove('active');
        input.keys[code] = false;
    };

    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
});

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

function startGame(e) {
    if (e) e.preventDefault();
    synth.init();
    synth.startMusic();
    buildLevel(scene);
    resetPlayer();
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('boss-bar').style.width = '100%';
    gameState = 'playing';
}

const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchstart', startGame, { passive: false });

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
