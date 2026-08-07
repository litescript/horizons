// BIG DEFINED CONSTANTS!! ---------------------------------
export const ORBITAL_ELEMENTS = {
  // a = semi-major axis, e = eccentricity, i = inclination,
  // O = longitude of ascending node, w = argument of perihelion
  Mercury: { a: 0.3871, e: 0.2056, i: 7.005, O: 48.331, w: 29.124 },
  Venus:   { a: 0.7233, e: 0.0068, i: 3.395, O: 76.680, w: 54.884 },
  Earth:   { a: 1.0000, e: 0.0167, i: 0.000, O: 0.000,  w: 102.947 },
  Mars:    { a: 1.5237, e: 0.0934, i: 1.850, O: 49.578, w: 286.502 },
  Jupiter: { a: 5.2028, e: 0.0484, i: 1.303, O: 100.464,w: 273.867 },
  Saturn:  { a: 9.5388, e: 0.0541, i: 2.489, O: 113.666,w: 339.392 },
  Uranus:  { a: 19.1914,e: 0.0473, i: 0.773, O: 74.006, w: 98.999 },
  Neptune: { a: 30.0611,e: 0.0086, i: 1.770, O: 131.784,w: 276.340 }
};

export const bodyConfig = {
  Sun: {
    texture: 'textures/2k_sun.jpg',
    radius: 5,
    material: 'basic',
  },

  Mercury: {
    texture: 'textures/2k_mercury.jpg',
    radius: 0.8,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },

  Venus: {
    texture: 'textures/2k_venus.jpg',
    radius: 0.9,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },

  Earth: {
    texture: 'textures/2k_earth_daymap.jpg',
    radius: 1,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },

  Mars: {
    texture: 'textures/2k_mars.jpg',
    radius: 0.8,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },

  Jupiter: {
    texture: 'textures/2k_jupiter.jpg',
    radius: 3,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },

  Saturn: {
    texture: 'textures/2k_saturn.jpg',
    radius: 2,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },

  Uranus: {
    texture: 'textures/2k_uranus.jpg',
    radius: 2,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },

  Neptune: {
    texture: 'textures/2k_neptune.jpg',
    radius: 2,
    material: 'standard',
    materialOptions: {
      emissive: 0x222222,
    }
  },
}
// ---------------------------------------------------------

