import * as THREE from 'three';

// RAYCASTER PICKING CLASS ---------------------------------

export class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
    this.pickedObjectOriginalScale = null;
  }
  pick(normalizedPosition, pickableObjects, camera) {
    if (this.pickedObject) {
      if (this.pickedObject.material.emissive) {
        this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      }
      if (this.pickedObjectOriginalScale) {
        this.pickedObject.scale.copy(this.pickedObjectOriginalScale);
      }
    }

    this.pickedObject = null;
    this.pickedObject = null;

    // cast a ray through the frustrum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(pickableObjects);

    if (intersectedObjects.length === 0) {
      return;
    }

    const object = intersectedObjects[0].object;

    // if (!object.material.emissive) {
    //   return;
    // }

    this.pickedObject = object;
    this.pickedObjectOriginalScale = object.scale.clone();

    if (object.material.emissive) {
      this.pickedObjectSavedColor =
        object.material.emissive.getHex();
      object.material.emissive.setHex(0x00ff00);
    } else {
      object.scale.setScalar(2.0);
    }

    console.log(this.pickedObject);
  }
}

// ---------------------------------------------------------

