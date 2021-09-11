import { Pin } from "./pin";

type Point = [number, number];
type Rect = [Point, Point];

const { log, tan, sin, pow, sqrt, round } = Math;

const RAD_1 = Math.PI / 180;
const RAD_90 = Math.PI / 4;

const M_RADIUS = 6378137.0;
const M_RADIUS_MINOR = 6356752.3142;
const M_RADIUS_FACTOR = (M_RADIUS - M_RADIUS_MINOR) / M_RADIUS;
const M_ECCENT = sqrt(2 * M_RADIUS_FACTOR - pow(M_RADIUS_FACTOR, 2));

const latLngToWsg84Mercator = ([lat, lng]: Point) => {
  const radLng = lng * RAD_1;
  const radLat = lat * RAD_1;

  const sinLat = M_ECCENT * sin(radLat);
  const divLat = (1 - sinLat) / (1 + sinLat);
  const projLat = log(tan(RAD_90 + radLat / 2) * divLat ** (M_ECCENT / 2));

  return [M_RADIUS * radLng, M_RADIUS * projLat];
};

const getLatLngToPoint = ([lbLatLng, rtLatLng]: Rect, size: Point) => {
  const [left, bottom] = latLngToWsg84Mercator(lbLatLng);
  const [right, top] = latLngToWsg84Mercator(rtLatLng);

  const width = (left - right) / size[0];
  const height = (top - bottom) / size[1];

  return (geoPoint: Point) => {
    const [xMerc, yMerc] = latLngToWsg84Mercator(geoPoint);
    return [round((left - xMerc) / width), round((top - yMerc) / height)];
  };
};

const blend = (color1: number, color2: number, alpha: number) => {
  // debugger;
  let rb = color1 & 0xff00ff;
  let g = color1 & 0x00ff00;
  rb += (((color2 & 0xff00ff) - rb) * alpha) >> 8;
  g += (((color2 & 0x00ff00) - g) * alpha) >> 8;
  return (rb & 0xff00ff) | (g & 0xff00);
};

const compose = (
  array1: Uint32Array,
  width1: number,
  height1: number,

  array2: Uint32Array,
  width2: number,
  height2: number,

  x1: number,
  y1: number
) => {
  let xOffset1;

  for (let y2 = 0; y2 < height2; y2++) {
    const yOffset1 = y1 + y2;
    if (height1 < yOffset1) break;

    xOffset1 = yOffset1 * width1 + x1;
    if (xOffset1 < 0) continue;

    for (let x2 = 0; x2 < width2; x2++) {
      const xOffset2 = y2 * height2 + x2;
      const color2 = array2[xOffset2];

      if (color2) {
        // const color1 = array1[xOffset1];
        array1[xOffset1] = color2;
        // array1[xOffset1] = !color1
        //   ? color2
        //   : blend(color1 >> 8, color2 >> 8, (color2 & 0xff000000) >> 24);
      }

      xOffset1++;
      if (array1.length < xOffset1) break;
    }
  }

  return array1;
};

const render = (bounds: Rect, size: Point, coords: Float32Array, pin: Pin) => {
  console.time("render");

  const { radius: pinRadius, buffer: pinBuffer } = pin;
  const pinSize = pinRadius * 2;
  const pinBitmap = new Uint32Array(pinBuffer);

  const getPoint = getLatLngToPoint(bounds, size);
  const [width, height] = size;

  const buffer = new ArrayBuffer(width * height * 4);
  const bitmap = new Uint32Array(buffer);

  for (let i = 0; i < coords.length / 2; i++) {
    const [x, y] = getPoint([coords[i * 2], coords[i * 2 + 1]]);
    // prettier-ignore
    compose(
      bitmap, width, height,
      pinBitmap, pinSize, pinSize,
      x - pinRadius, y - pinRadius,
    );
  }

  const corner = [0, 0];

  console.timeEnd("render");
  postMessage(
    { type: "compose", payload: { bounds, corner, size, buffer } },
    { transfer: [buffer] }
  );
};

let selfPin: Pin;
let selfCoords: Float32Array;

onmessage = ({ data: { type, payload } }) => {
  console.log(type, payload);
  switch (type) {
    case "init": {
      selfPin = payload.pin;
      return;
    }
    case "coords": {
      selfCoords = new Float32Array(payload);
      return;
    }
    case "render": {
      const { bounds, size } = payload;
      render(bounds, size, selfCoords, selfPin);
    }
  }
};
