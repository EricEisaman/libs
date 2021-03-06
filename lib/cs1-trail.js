AFRAME.registerSystem("trail", {
  schema: {},
  init: function() {},
  trails: { haveTrails: [] },
  createTrail: function createTrail(
    object,
    length,
    width,
    resolution,
    color,
    offset
  ) {
    if (resolution > length) {
      resolution = length;
    }
    if (!object.userData.trails) object.userData.trails = [];
    const trail = {
      length: Math.round(length),
      width: width,
      resolution: Math.round(resolution),
      trailHistory: [],
      trailVertices: [],
      worldDirection: new THREE.Vector3()
    };
    object.userData.trails.push(trail);
    var geometry = new THREE.PlaneGeometry(1, length, 1, resolution);
    var material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      wireframe: !1,
      transparent: !0,
      opacity: 0.2
    });
    trail.mesh = new THREE.Mesh(geometry, material);
    trail.mesh.position.add(offset);
    this.el.sceneEl.object3D.add(trail.mesh);
    this.trails.haveTrails.push(object);
    trail.mesh.frustumCulled = !1;
    trail.trailHistory = [];
    trail.trailVertices = [];
    for (var i = 0; i < resolution + 1; i++) {
      trail.trailVertices[i] = [];
    }
    for (var i = 0; i < trail.trailVertices.length; i++) {
      trail.trailVertices[i][0] = trail.mesh.geometry.vertices[i * 2];
      trail.trailVertices[i][1] = trail.mesh.geometry.vertices[i * 2 + 1];
    }
  },
  updateTrailHistory: function updateTrailHistory(object) {
    object.userData.trails.forEach(trail => {
      object.getWorldDirection(trail.worldDirection);
      trail.trailHistory.push([
        object.position.x,
        object.position.y,
        object.position.z,
        trail.worldDirection.x,
        trail.worldDirection.z
      ]);
      if (trail.trailHistory.length > trail.length) {
        trail.trailHistory.shift();
      }
    });
  },
  updateTrails: function updateTrails() {
    for (let i = 0; i < this.trails.haveTrails.length; i++) {
      const object = this.trails.haveTrails[i];
      this.updateTrailHistory(object);
      object.userData.trails.forEach(trail => {
        for (var j = 0; j < trail.trailVertices.length; j++) {
          var index = Math.round(
            (trail.trailHistory.length / trail.resolution) * j
          );
          if (index === trail.trailHistory.length) {
            index = trail.trailHistory.length - 1;
          }
          var pos = trail.trailHistory[index];
          var width =
            (THREE.Math.mapLinear(j, 0, trail.trailVertices.length, 0, 1) *
              trail.width) /
            2;
          if (typeof pos != "undefined") {
            trail.trailVertices[j][0].x = pos[0] - pos[4] * width;
            trail.trailVertices[j][0].y = pos[1];
            trail.trailVertices[j][0].z = pos[2] + pos[3] * width;
            trail.trailVertices[j][1].x = pos[0] + pos[4] * width;
            trail.trailVertices[j][1].y = pos[1];
            trail.trailVertices[j][1].z = pos[2] - pos[3] * width;
          }
        }
        trail.mesh.geometry.verticesNeedUpdate = !0;
      });
    }
  },
  resetTrail: function resetTrail(object) {
    object.userData.trails.forEach(trail => {
      trail.trailHistory = [];
    });
  },
  tick: function(t, dt) {
    this.updateTrails();
  }
});
AFRAME.registerComponent("trail", {
  schema: {
    length: { default: 80 },
    width: { default: 0.8 },
    resolution: { default: 18 },
    color: { default: "white" },
    offset: { type: "vec3" }
  },
  multiple: !0,
  init: function() {
    this.system.createTrail(
      this.el.object3D,
      this.data.length,
      this.data.width,
      this.data.resolution,
      this.data.color,
      this.data.offset
    );
  },
  reset: function() {
    this.system.reset(this.el.object3D);
  }
});
