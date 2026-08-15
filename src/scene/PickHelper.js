import * as THREE from 'three';

// RAYCASTER PICKING CLASS ---------------------------------

export class PickHelper {
  constructor(onPickChange) {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.halo = null;
    this.onPickChange = onPickChange;
  }
  pick(normalizedPosition, pickableObjects, camera) {
    this.raycaster.setFromCamera(normalizedPosition, camera);

    const intersectedObjects =
      this.raycaster.intersectObjects(pickableObjects);

    const object =
      intersectedObjects.length > 0
        ? intersectedObjects[0].object
        : null;

    if (object === this.pickedObject) {
      return;
    }

    this.restorePickedObject();

    this.pickedObject = object;

    if (!object) {
      this.onPickChange?.(null);
      return;
    }

    this.applyPickedEffect(object);
    this.onPickChange?.(object);
  }

  applyPickedEffect(object) {
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x189ad3,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.halo = new THREE.Mesh(
      object.geometry,
      haloMaterial,
    );

    this.halo.scale.setScalar(1.10);

    object.add(this.halo);
  }

  restorePickedObject() {
    if (!this.halo) {
      return;
    }

    this.halo.removeFromParent();
    this.halo.material.dispose();

    this.halo = null;
  }
}

// ---------------------------------------------------------

