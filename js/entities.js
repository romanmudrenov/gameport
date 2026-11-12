import { synth } from './audio.js';
import { createCommandoMesh } from './models.js';
import { world, LEVEL_LENGTH } from './level.js';

export const player = {
    mesh: createCommandoMesh(false),
    x: 0,
    y: 2,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    crouching: false,
    lives: 5,
    invuln: 0,
    weapon: 'rifle',
    shootTimer: 0,
    animTime: 0,
    score: 0
};

export function resetPlayer() {
    player.x = 0;
    player.y = 2;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
    player.lives = 5;
    player.score = 0;
    player.weapon = 'rifle';
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

export function spawnExplosion(scene, x, y, count = 18, color = 0xff6600) {
    for (let i = 0; i < count; i++) {
        const size = 0.15 + Math.random() * 0.25;
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? color : 0xffff44 })
        );
        mesh.position.set(x, y, (Math.random() - 0.5) * 1.2);
        scene.add(mesh);

        world.particles.push({
            mesh,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.2) * 14,
            vz: (Math.random() - 0.5) * 8,
            life: 0.45 + Math.random() * 0.35
        });
    }
}

export function fireBullet(scene, x, y, angle, isEnemy, isSpread = false) {
    const speed = isEnemy ? 10.5 : 24;
    const count = isSpread ? 5 : 1;

    for (let k = 0; k < count; k++) {
        const offset = isSpread ? (k - 2) * 0.12 : 0;
        const a = angle + offset;
        const geo = new THREE.SphereGeometry(isSpread || isEnemy ? 0.22 : 0.15, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: isEnemy ? 0xffaa00 : (isSpread ? 0xff3333 : 0x44ffff)
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 0);
        scene.add(mesh);

        world.bullets.push({
            mesh,
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            isEnemy,
            life: 2.2
        });
    }
}

function getAimAngle(keys) {
    const up = keys['KeyW'] || keys['ArrowUp'];
    const down = keys['KeyS'] || keys['ArrowDown'];
    const horiz = keys['KeyA'] || keys['ArrowLeft'] || keys['KeyD'] || keys['ArrowRight'];

    if (up && horiz) return player.facing === 1 ? Math.PI / 4 : (3 * Math.PI) / 4;
    if (up) return Math.PI / 2;
    if (down && !player.onGround) {
        if (horiz) return player.facing === 1 ? -Math.PI / 4 : -(3 * Math.PI) / 4;
        return -Math.PI / 2;
    }
    return player.facing === 1 ? 0 : Math.PI;
}

function damagePlayer(scene, onEndGame) {
    if (player.invuln > 0) return;
    player.lives--;
    player.weapon = 'rifle';
    player.invuln = 2.0;
    synth.sfxHit();
    spawnExplosion(scene, player.x, player.y + 1, 12, 0xff2222);
    updateHUD();

    if (player.lives <= 0) {
        onEndGame(false);
    }
}

export function updateSimulation(dt, scene, camera, input, onEndGame) {
    const keys = input.keys;
    const left = keys['KeyA'] || keys['ArrowLeft'];
    const right = keys['KeyD'] || keys['ArrowRight'];
    const down = keys['KeyS'] || keys['ArrowDown'];

    player.crouching = down && player.onGround && !left && !right;

    if (left && !player.crouching) {
        player.vx = -7.8;
        player.facing = -1;
    } else if (right && !player.crouching) {
        player.vx = 7.8;
        player.facing = 1;
    } else {
        player.vx = 0;
    }

    const prevY = player.y;
    player.vy -= 32 * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    if (player.x < -6) player.x = -6;
    if (player.x > LEVEL_LENGTH - 3.5) player.x = LEVEL_LENGTH - 3.5;

    player.onGround = false;
    for (let i = 0; i < world.platforms.length; i++) {
        const p = world.platforms[i];
        if (player.x >= p.x - 0.35 && player.x <= p.x + p.width + 0.35) {
            if (prevY >= p.y - 0.08 && player.y <= p.y && player.vy <= 0) {
                player.y = p.y;
                player.vy = 0;
                player.onGround = true;
                break;
            }
        }
    }

    if (player.y < -4.5) {
        damagePlayer(scene, onEndGame);
        if (player.lives > 0) {
            player.y = 7;
            player.vy = 0;
            player.x = Math.max(0, player.x - 5);
        }
    }

    player.invuln = Math.max(0, player.invuln - dt);
    player.mesh.visible = player.invuln > 0 ? Math.floor(player.invuln * 16) % 2 === 0 : true;

    player.mesh.position.set(player.x, player.y, 0);
    player.mesh.scale.y = player.crouching ? 0.62 : 1.0;
    player.mesh.rotation.y = player.facing === 1 ? 0 : Math.PI;

    const parts = player.mesh.userData;
    if (!player.onGround) {
        player.animTime += dt * 16;
        player.mesh.rotation.z = -player.facing * player.animTime;
    } else {
        player.mesh.rotation.z = 0;
        if (Math.abs(player.vx) > 0.1) {
            player.animTime += dt * 14;
            parts.leftLeg.rotation.z = Math.sin(player.animTime) * 0.65;
            parts.rightLeg.rotation.z = -Math.sin(player.animTime) * 0.65;
        } else {
            parts.leftLeg.rotation.z = 0;
            parts.rightLeg.rotation.z = 0;
        }
    }

    const aimAngle = getAimAngle(keys);
    parts.armPivot.rotation.z = player.facing === -1 ? Math.PI - aimAngle : aimAngle;

    player.shootTimer -= dt;
    if ((keys['KeyJ'] || keys['KeyZ'] || input.mouseDown) && player.shootTimer <= 0) {
        const isSpread = player.weapon === 'spread';
        player.shootTimer = isSpread ? 0.20 : 0.13;
        const muzzleY = player.y + (player.crouching ? 0.9 : 1.48) + Math.sin(aimAngle) * 0.9;
        const muzzleX = player.x + Math.cos(aimAngle) * 1.1;
        fireBullet(scene, muzzleX, muzzleY, aimAngle, false, isSpread);
        synth.sfxShoot(isSpread);
    }

    const targetCamX = Math.min(LEVEL_LENGTH - 8, Math.max(4, player.x + 4.5));
    camera.position.x += (targetCamX - camera.position.x) * 6 * dt;
    camera.position.y += ((player.y * 0.35 + 4.2) - camera.position.y) * 4 * dt;
    camera.position.z = 15.5;
    camera.lookAt(camera.position.x + 1, camera.position.y - 0.8, 0);

    for (let i = world.powerups.length - 1; i >= 0; i--) {
        const pw = world.powerups[i];
        pw.time += dt * 3;
        pw.mesh.position.y = pw.baseY + Math.sin(pw.time) * 0.45;
        pw.mesh.rotation.y += dt * 2.5;

        if (Math.hypot(player.x - pw.x, (player.y + 1) - pw.mesh.position.y) < 1.3) {
            player.weapon = 'spread';
            player.score += 500;
            synth.sfxPowerup();
            spawnExplosion(scene, pw.x, pw.mesh.position.y, 12, 0xffff00);
            scene.remove(pw.mesh);
            world.powerups.splice(i, 1);
            updateHUD();
        }
    }

    for (let i = 0; i < world.enemies.length; i++) {
        const e = world.enemies[i];
        const dist = Math.abs(e.x - player.x);
        if (dist > 26) continue;

        if (e.type === 'soldier') {
            e.x += e.vx * dt;
            if (e.x < e.patrolMin) e.vx = Math.abs(e.vx);
            if (e.x > e.patrolMax) e.vx = -Math.abs(e.vx);
            e.mesh.position.x = e.x;
            e.mesh.rotation.y = e.vx > 0 ? 0 : Math.PI;

            e.animTime += dt * 10;
            e.mesh.userData.leftLeg.rotation.z = Math.sin(e.animTime) * 0.55;
            e.mesh.userData.rightLeg.rotation.z = -Math.sin(e.animTime) * 0.55;

            e.cooldown -= dt;
            if (e.cooldown <= 0 && dist < 16) {
                e.cooldown = 1.7 + Math.random();
                const dir = player.x > e.x ? 0 : Math.PI;
                fireBullet(scene, e.x + (player.x > e.x ? 0.8 : -0.8), e.y + 1.4, dir, true);
            }

            if (Math.abs(player.x - e.x) < 0.75 && Math.abs(player.y - e.y) < 1.5) {
                damagePlayer(scene, onEndGame);
            }
        } else if (e.type === 'turret') {
            const ang = Math.atan2((player.y + 1) - e.y, player.x - e.x);
            e.barrelPivot.rotation.z = ang;
            e.cooldown -= dt;
            if (e.cooldown <= 0 && dist < 18) {
                e.cooldown = 1.6;
                fireBullet(scene, e.x + Math.cos(ang), e.y + Math.sin(ang), ang, true);
            }
        }
    }

    const boss = world.boss;
    if (boss && Math.abs(boss.x - player.x) < 24) {
        document.getElementById('boss-bar-container').style.display = 'block';
        boss.phaseTime += dt * 4;
        boss.core.scale.setScalar(1 + Math.sin(boss.phaseTime) * 0.12);

        boss.cooldown -= dt;
        if (boss.cooldown <= 0) {
            boss.cooldown = 1.15;
            const ang = Math.atan2((player.y + 1) - 6.8, player.x - boss.x);
            fireBullet(scene, boss.x, 6.8, ang - 0.12, true);
            fireBullet(scene, boss.x, 6.8, ang + 0.12, true);
        }
    }

    for (let i = world.bullets.length - 1; i >= 0; i--) {
        const b = world.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        b.mesh.position.set(b.x, b.y, 0);

        let hit = false;
        if (b.isEnemy) {
            const pH = player.crouching ? 1.1 : 1.9;
            if (Math.abs(b.x - player.x) < 0.45 && b.y >= player.y && b.y <= player.y + pH) {
                damagePlayer(scene, onEndGame);
                hit = true;
            }
        } else {
            }
        } else {
Используйте код с осторожностью.
for (let j = world.enemies.length - 1; j >= 0; j--) {
const e = world.enemies[j];
const hitY = e.type === 'soldier' ? e.y + 1.1 : e.y;
if (Math.hypot(b.x - e.x, b.y - hitY) < 0.95) {
e.hp--;
hit = true;
spawnExplosion(scene, b.x, b.y, 4, 0xffaa00);
if (e.hp <= 0) {
synth.sfxExplosion();
spawnExplosion(scene, e.x, hitY, 20, 0xff4400);
scene.remove(e.mesh);
world.enemies.splice(j, 1);
player.score += e.type === 'turret' ? 300 : 150;
updateHUD();
}
break;
}
}
if (!hit && world.boss && Math.hypot(b.x - world.boss.x, b.y - world.boss.y) < 1.65) {
world.boss.hp--;
hit = true;
spawnExplosion(scene, b.x, b.y, 6, 0xff0055);
const pct = Math.max(0, (world.boss.hp / world.boss.maxHp) * 100);
document.getElementById('boss-bar').style.width = pct + '%';
if (world.boss.hp <= 0) {
synth.sfxExplosion();
spawnExplosion(scene, world.boss.x, world.boss.y + 1, 55, 0xff2200);
scene.remove(world.boss.mesh);
world.boss = null;
player.score += 5000;
updateHUD();
setTimeout(() => onEndGame(true), 1200);
}
}
}
if (hit || b.life <= 0) {
scene.remove(b.mesh);
world.bullets.splice(i, 1);
}
}
for (let i = world.particles.length - 1; i >= 0; i--) {
const p = world.particles[i];
p.vy -= 18 * dt;
p.mesh.position.x += p.vx * dt;
p.mesh.position.y += p.vy * dt;
p.mesh.position.z += p.vz * dt;
p.mesh.rotation.x += 6 * dt;
p.mesh.rotation.y += 6 * dt;
p.life -= dt;
if (p.life <= 0) {
scene.remove(p.mesh);
world.particles.splice(i, 1);
}
}
}
