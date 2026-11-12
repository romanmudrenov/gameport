import { synth } from './audio.js';
import { createCommandoMesh } from './models.js';
import { world, LEVEL_LENGTH } from './level.js';
import { fireBullet, spawnExplosion, updateWorldCombat } from './combat.js';

export const player = {
    mesh: createCommandoMesh(false),
    x: 0, y: 2, vx: 0, vy: 0, facing: 1,
    onGround: false, crouching: false,
    lives: 5, invuln: 0, weapon: 'rifle',
    shootTimer: 0, animTime: 0, score: 0
};

export function resetPlayer() {
    player.x = 0; player.y = 2;
    player.vx = 0; player.vy = 0;
    player.facing = 1; player.lives = 5;
    player.score = 0; player.weapon = 'rifle';
    player.invuln = 1.5;
    updateHUD();
}

export function updateHUD() {
    const hearts = '♥ '.repeat(Math.max(0, player.lives)).trim();
    document.getElementById('lives-display').innerText = 'HP: ' + (hearts || '0');
    document.getElementById('score-display').innerText = 'SCORE: ' + String(player.score).padStart(5, '0');
    document.getElementById('weapon-display').innerText =
        player.weapon === 'spread' ? 'ОРУЖИЕ: [S] SPREAD GUN' : 'ОРУЖИЕ: RIFLE [АВТО]';
}

export function damagePlayer(scene, onEndGame) {
    if (player.invuln > 0) return;
    player.lives--;
    player.weapon = 'rifle';
    player.invuln = 2.0;
    synth.sfxHit();
    spawnExplosion(scene, player.x, player.y + 1, 12, 0xff2222);
    updateHUD();
    if (player.lives <= 0) onEndGame(false);
}

function getAimAngle(keys) {
    const up = keys['KeyW'] || keys['ArrowUp'];
    const down = keys['KeyS'] || keys['ArrowDown'];
    const horiz = keys['KeyA'] || keys['ArrowLeft'] || keys['KeyD'] || keys['ArrowRight'];
    if (up && horiz) return player.facing === 1 ? Math.PI / 4 : (3 * Math.PI) / 4;
    if (up) return Math.PI / 2;
    if (down && !player.onGround) {
        return horiz ? (player.facing === 1 ? -Math.PI / 4 : -(3 * Math.PI) / 4) : -Math.PI / 2;
    }
    return player.facing === 1 ? 0 : Math.PI;
}

export function updateSimulation(dt, scene, camera, input, onEndGame) {
    const keys = input.keys;
    const left = keys['KeyA'] || keys['ArrowLeft'];
    const right = keys['KeyD'] || keys['ArrowRight'];
    const down = keys['KeyS'] || keys['ArrowDown'];

    player.crouching = Boolean(down && player.onGround && !left && !right);
    player.vx = 0;
    if (left && !player.crouching) { player.vx = -7.8; player.facing = -1; }
    if (right && !player.crouching) { player.vx = 7.8; player.facing = 1; }

    const prevY = player.y;
    player.vy -= 32 * dt;
    player.x = Math.max(-6, Math.min(LEVEL_LENGTH - 3.5, player.x + player.vx * dt));
    player.y += player.vy * dt;

    player.onGround = false;
    for (let i = 0; i < world.platforms.length; i++) {
        const p = world.platforms[i];
        if (player.x >= p.x - 0.35 && player.x <= p.x + p.width + 0.35) {
            if (prevY >= p.y - 0.08 && player.y <= p.y && player.vy <= 0) {
                player.y = p.y; player.vy = 0; player.onGround = true; break;
            }
        }
    }

    if (player.y < -4.5) {
        damagePlayer(scene, onEndGame);
        if (player.lives > 0) { player.y = 7; player.vy = 0; player.x = Math.max(0, player.x - 5); }
    }

    player.invuln = Math.max(0, player.invuln - dt);
    player.mesh.visible = player.invuln > 0 ? Math.floor(player.invuln * 16) % 2 === 0 : true;
    player.mesh.position.set(player.x, player.y, 0);
    player.mesh.scale.y = player.crouching ? 0.62 : 1.0;
    player.mesh.rotation.y = player.facing === 1 ? 0 : Math.PI;

    const parts = player.mesh.userData;
    player.mesh.rotation.z = 0;
    parts.leftLeg.rotation.z = 0;
    parts.rightLeg.rotation.z = 0;

    if (!player.onGround) {
        player.animTime += dt * 16;
        player.mesh.rotation.z = -player.facing * player.animTime;
    }
    if (player.onGround && Math.abs(player.vx) > 0.1) {
        player.animTime += dt * 14;
        parts.leftLeg.rotation.z = Math.sin(player.animTime) * 0.65;
        parts.rightLeg.rotation.z = -Math.sin(player.animTime) * 0.65;
    }

    const aim = getAimAngle(keys);
    parts.armPivot.rotation.z = player.facing === -1 ? Math.PI - aim : aim;

    player.shootTimer -= dt;
    if ((keys['KeyJ'] || keys['KeyZ'] || input.mouseDown) && player.shootTimer <= 0) {
        const sp = player.weapon === 'spread';
        player.shootTimer = sp ? 0.20 : 0.13;
        const my = player.y + (player.crouching ? 0.9 : 1.48) + Math.sin(aim) * 0.9;
        fireBullet(scene, player.x + Math.cos(aim) * 1.1, my, aim, false, sp);
        synth.sfxShoot(sp);
    }

    const camX = Math.min(LEVEL_LENGTH - 8, Math.max(4, player.x + 4.5));
    camera.position.x += (camX - camera.position.x) * 6 * dt;
    camera.position.y += ((player.y * 0.35 + 4.2) - camera.position.y) * 4 * dt;
    camera.position.z = 15.5;
    camera.lookAt(camera.position.x + 1, camera.position.y - 0.8, 0);

    updateWorldCombat(dt, scene, player, updateHUD, damagePlayer, onEndGame);
}
