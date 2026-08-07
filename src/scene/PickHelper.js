import * as THREE from 'three';

// RAYCASTER PICKING CLASS ---------------------------------

export class PickHelper {
  constructor(onPickChange) {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
    this.pickedObjectOriginalScale = null;
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

    if (object === this.PickedObject) {
      return;
    }

    this.restorePickedObject();

    this.pickedObject = object;

    if (!object) {
      this.onPickChange?.(null);
      return;
    }

    this.pickedObjectOriginalScale = object.scale.clone();

    if (object.material.emissive) {
      this.pickedObjectSavedColor =
        object.material.emissive.getHex();

      object.material.emissive.setHex(0x00ff00);
    }
    this.onPickChange?.(object);
  }

  restorePickedObject() {
    if (!this.pickedObject) {
      return;
    }

    if (this.pickedObject.material.emissive) {
      this.pickedObject.material.emissive.setHex(
        this.pickedObjectSavedColor,
      );
    }

    if (this.pickedObjectOriginalScale) {
      this.pickedObject.scale.copy(
        this.pickedObjectOriginalScale,
      );
    }
  }
}

// ---------------------------------------------------------

