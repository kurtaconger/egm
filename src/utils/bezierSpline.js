// utils/bezierSpline.js

// This file combines the necessary parts from @turf to avoid dependency on @turf libraries


function getGeom(geojson) {
    if (geojson.type === "Feature") {
        return geojson.geometry;
    }
    return geojson;
}

function lineString(coordinates, properties) {
    if (coordinates.length < 2) {
        throw new Error("coordinates must be an array of two or more positions");
    }
    const geom = {
        type: "LineString",
        coordinates
    };
    return {
        type: "Feature",
        geometry: geom,
        properties: properties || {}
    };
}

// Core bezier spline logic

class Spline {
    constructor(options) {
        this.points = options.points || [];
        this.duration = options.duration || 10000;
        this.sharpness = options.sharpness || 0.85;
        this.centers = [];
        this.controls = [];
        this.stepLength = options.stepLength || 60;
        this.length = this.points.length;
        this.delay = 0;
        for (let i = 0; i < this.length; i++) {
            this.points[i].z = this.points[i].z || 0;
        }
        for (let i = 0; i < this.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            this.centers.push({
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
                z: (p1.z + p2.z) / 2
            });
        }
        this.controls.push([this.points[0], this.points[0]]);
        for (let i = 0; i < this.centers.length - 1; i++) {
            const dx = this.points[i + 1].x - (this.centers[i].x + this.centers[i + 1].x) / 2;
            const dy = this.points[i + 1].y - (this.centers[i].y + this.centers[i + 1].y) / 2;
            const dz = this.points[i + 1].z - (this.centers[i].y + this.centers[i + 1].z) / 2;
            this.controls.push([
                {
                    x: (1 - this.sharpness) * this.points[i + 1].x + this.sharpness * (this.centers[i].x + dx),
                    y: (1 - this.sharpness) * this.points[i + 1].y + this.sharpness * (this.centers[i].y + dy),
                    z: (1 - this.sharpness) * this.points[i + 1].z + this.sharpness * (this.centers[i].z + dz)
                },
                {
                    x: (1 - this.sharpness) * this.points[i + 1].x + this.sharpness * (this.centers[i + 1].x + dx),
                    y: (1 - this.sharpness) * this.points[i + 1].y + this.sharpness * (this.centers[i + 1].y + dy),
                    z: (1 - this.sharpness) * this.points[i + 1].z + this.sharpness * (this.centers[i + 1].z + dz)
                }
            ]);
        }
        this.controls.push([
            this.points[this.length - 1],
            this.points[this.length - 1]
        ]);
        this.steps = this.cacheSteps(this.stepLength);
        return this;
    }

    cacheSteps(mindist) {
        const steps = [];
        let laststep = this.pos(0);
        steps.push(0);
        for (let t = 0; t < this.duration; t += 10) {
            const step = this.pos(t);
            const dist = Math.sqrt(
                (step.x - laststep.x) * (step.x - laststep.x) + (step.y - laststep.y) * (step.y - laststep.y) + (step.z - laststep.z) * (step.z - laststep.z)
            );
            if (dist > mindist) {
                steps.push(t);
                laststep = step;
            }
        }
        return steps;
    }

    pos(time) {
        let t = time - this.delay;
        if (t < 0) {
            t = 0;
        }
        if (t > this.duration) {
            t = this.duration - 1;
        }
        const t2 = t / this.duration;
        if (t2 >= 1) {
            return this.points[this.length - 1];
        }
        const n = Math.floor((this.points.length - 1) * t2);
        const t1 = (this.length - 1) * t2 - n;
        return bezier(
            t1,
            this.points[n],
            this.controls[n][1],
            this.controls[n + 1][0],
            this.points[n + 1]
        );
    }
}

function bezier(t, p1, c1, c2, p2) {
    const b = B(t);
    const pos = {
        x: p2.x * b[0] + c2.x * b[1] + c1.x * b[2] + p1.x * b[3],
        y: p2.y * b[0] + c2.y * b[1] + c1.y * b[2] + p1.y * b[3],
        z: p2.z * b[0] + c2.z * b[1] + c1.z * b[2] + p1.z * b[3]
    };
    return pos;
}

function B(t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return [
        t3,
        3 * t2 * (1 - t),
        3 * t * (1 - t) * (1 - t),
        (1 - t) * (1 - t) * (1 - t)
    ];
}

function bezierSpline(line, options = {}) {
    const resolution = options.resolution || 10000;
    const sharpness = options.sharpness || 0.85;
    const coords = [];
    const points = getGeom(line).coordinates.map((pt) => {
        return { x: pt[0], y: pt[1] };
    });
    const spline = new Spline({
        duration: resolution,
        points,
        sharpness
    });
    const pushCoord = (time) => {
        var pos = spline.pos(time);
        if (Math.floor(time / 100) % 2 === 0) {
            coords.push([pos.x, pos.y]);
        }
    };
    for (var i = 0; i < spline.duration; i += 10) {
        pushCoord(i);
    }
    pushCoord(spline.duration);
    return lineString(coords, options.properties);
}

export default bezierSpline;