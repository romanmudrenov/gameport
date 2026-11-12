import { synth } from './audio.js';
import { world } from './level.js';

export function spawnExplosion(scene, x, y, count = 14, color = 0xff6600) {
    for (let i = 0; i < count; i++) {
        const s = 0.15 + Math.random() * 0.25;
        const matColor = i % 2 === 0 ? color : 0xffff44;
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(s, s, s),
            new THREE.MeshBasicMaterial({ color: matColor })
        );
        mesh.position.set(x, y, (Math.random() - 0.5) * 1.2);
        scene.add(mesh);
        world.particles.push({
            mesh,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.2) * 14,
            vz: (Math.random() - 0.5) * 8,
            life: 0.5
        });
    }
}

export function fireBullet(scene, x, y, angle, isEnemy, isSpread = false) {
    const speed = isEnemy ? 10.5 : 24;
    const count = isSpread ? 5 : 1;
    const bColor = isEnemy ? 0xffaa00 : (isSpread ? 0xff3333 : 0x44ffff);
    const radius = (isSpread || isEnemy) ? 0.22 : 0.15;

    for (let k = 0; k < count; k++) {
        const a = angle + (isSpread ? (k - 2) * 0.12 : 0);
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 8, 8),
            new THREE.MeshBasicMaterial({ color: bColor })
        );
        mesh.position.set(x, y, 0);
        scene.add(mesh);
        world.bullets.push({
            mesh, x, y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            isEnemy,
            life: 2.2
        });
    }
}

export function updateWorldCombat(dt, scene, player, updateHUD, damagePlayer, onEndGame) {
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
                e.cooldown = 1.8;
                const d = player.x > e.x ? 0 : Math.PI;
                fireBullet(scene, e.x + (player.x > e.x ? 0.8 : -0.8), e.y + 1.4, d, true);
            }
            if (Math.abs(player.x - e.x) < 0.75 && Math.abs(player.y - e.y) < 1.5) {
                damagePlayer(scene, onEndGame);
            }
        }

        if (e.type === 'turret') {
            const ang = Math.atan2((player.y + 1) - e.y, player.x - e.x);
            e.barrelPivot.rotation.z = ang;
            e.cooldown -= dt;
            if (e.cooldown <= 0 && dist < 18) {
                e.cooldown = 1.6;
                fireBullet(scene, e.x + Math.cos(ang), e.y + Math.sin(ang), ang, true);
            }
        }
    }

    if (world.boss && Math.abs(world.boss.x - player.x) < 24) {
        const boss = world.boss;
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
        }

        if (!b.isEnemy) {
            for (let j = world.enemies.length - 1; j >= 0; j--) {
                const e = world.enemies[j];
                const hy = e.type === 'soldier' ? e.y + 1.1 : e.y;
                if (Math.hypot(b.x - e.x, b.y - hy) < 0.95) {
                    e.hp--;
                    hit = true;
                    spawnExplosion(scene, b.x, b.y, 4, 0xffaa00);
                    if (e.hp <= 0) {
                        synth.sfxExplosion();
                        spawnExplosion(scene, e.x, hy, 20, 0xff4400);
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
                    spawnExplosion(scene, world.boss.x, world.boss.y + 1, 50, 0xff2200);
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
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            world.particles.splice(i, 1);
        }
    }
}
