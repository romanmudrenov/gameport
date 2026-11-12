import { textures } from './textures.js';

export function createCommandoMesh(isEnemy = false) {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshLambertMaterial({ color: isEnemy ? 0xd29979 : 0xf1b28a });
    const torsoMat = new THREE.MeshLambertMaterial({ color: isEnemy ? 0xaa2222 : 0x2255cc });
    const pantsMat = new THREE.MeshLambertMaterial({
        map: textures.camo,
        color: isEnemy ? 0xff8888 : 0xffffff
    });
    const bandanaMat = new THREE.MeshLambertMaterial({ color: isEnemy ? 0xffcc00 : 0xff2222 });
    const gunMat = new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 80 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), torsoMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    head.position.y = 1.98;
    group.add(head);

    const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.54), bandanaMat);
    bandana.position.y = 2.08;
    group.add(bandana);

    if (!isEnemy) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.12), bandanaMat);
        tail.position.set(-0.32, 2.04, 0);
        tail.rotation.z = 0.3;
        group.add(tail);
    }

    const legGeo = new THREE.BoxGeometry(0.28, 0.8, 0.32);
    legGeo.translate(0, -0.4, 0);

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(0, 0.85, 0.12);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0, 0.85, -0.12);
    group.add(rightLeg);

    const armPivot = new THREE.Group();
    armPivot.position.set(0, 1.45, 0);

    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.52), skinMat);
    armMesh.position.set(0.25, 0, 0);
    armPivot.add(armMesh);

    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.16), gunMat);
    gunBody.position.set(0.65, 0.04, 0);
    armPivot.add(gunBody);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45), gunMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(1.2, 0.06, 0);
    armPivot.add(barrel);

    group.add(armPivot);
    group.userData = { leftLeg, rightLeg, armPivot };
    return group;
}

export function createTurretMesh() {
    const group = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.4, 1.4),
        new THREE.MeshLambertMaterial({ map: textures.metal })
    );
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0xcc2222 })
    );
    group.add(base, dome);

    const barrelPivot = new THREE.Group();
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.1),
        new THREE.MeshPhongMaterial({ color: 0xdddddd })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 0.55;
    barrelPivot.add(barrel);
    group.add(barrelPivot);

    return { group, barrelPivot };
}

export function createPowerupMesh() {
    const group = new THREE.Group();
    const wings = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.45, 0.45),
        new THREE.MeshPhongMaterial({ color: 0xff2222, emissive: 0x550000 })
    );
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0xffdd00, emissive: 0x664400 })
    );
    group.add(wings, core);
    return group;
}

export function createBossMesh() {
    const group = new THREE.Group();

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(6, 12, 5),
        new THREE.MeshLambertMaterial({ map: textures.metal })
    );
    wall.position.set(2, 5, 0);
    group.add(wall);

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0xff1144, emissive: 0xaa0022, shininess: 100 })
    );
    core.position.set(-1.1, 3.2, 0);
    group.add(core);

    const gunMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const gun1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.6), gunMat);
    gun1.position.set(-1.2, 6.8, 0.8);
    const gun2 = gun1.clone();
    gun2.position.z = -0.8;
    group.add(gun1, gun2);

    return { group, core };
}
