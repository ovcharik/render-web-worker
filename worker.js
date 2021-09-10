const { log, tan, sin, pow, sqrt, round } = Math;

const RAD_1 = Math.PI / 180;
const RAD_90 = Math.PI / 4;

const M_RADIUS = 6378137.0;
const M_RADIUS_MINOR = 6356752.3142;
const M_RADIUS_FACTOR = (M_RADIUS - M_RADIUS_MINOR) / M_RADIUS;
const M_ECCENT = sqrt(2 * M_RADIUS_FACTOR - pow(M_RADIUS_FACTOR, 2));

const latLngToWsg84Mercator = ([lat, lng]) => {
  const radLng = lng * RAD_1;
  const radLat = lat * RAD_1;

  const sinLat = M_ECCENT * sin(radLat);
  const divLat = (1 - sinLat) / (1 + sinLat);
  const projLat = log(tan(RAD_90 + radLat / 2) * divLat ** (M_ECCENT / 2));

  return [M_RADIUS * radLng, M_RADIUS * projLat];
};

const getLatLngToPoint = ([lbLatLng, rtLatLng], size) => {
  const [left, bottom] = latLngToWsg84Mercator(lbLatLng);
  const [right, top] = latLngToWsg84Mercator(rtLatLng);

  const width = (left - right) / size[0];
  const height = (top - bottom) / size[0];

  return (geoPoint) => {
    const [xMerc, yMerc] = latLngToWsg84Mercator(geoPoint);
    return [round((left - xMerc) / width), round((top - yMerc) / height)];
  };
};

const compose = (
  // will be mutated
  bgArray,
  bgWidth,
  bgHeight,

  // will be inserted
  fgArray,
  fgWidth,
  fgHeight,

  // left-top coordinates of bg
  bgX,
  bgY,

  blend = false
) => {
  let bgOffset;

  for (let fgY = 0; fgY < fgHeight; fgY++) {
    const bgYOffset = bgY + fgY;
    if (bgHeight < bgYOffset) break;

    bgOffset = (bgYOffset * bgWidth + bgX) * 4;
    if (bgOffset < 0) continue;

    for (let fgX = 0; fgX < fgWidth; fgX++) {
      const pinOffset = (fgY * fgHeight + fgX) * 4;
      const fgColor = fgArray.subarray(pinOffset, pinOffset + 4);
      const bgColor = bgArray.subarray(bgOffset, bgOffset + 4);

      if (fgColor[3] && bgColor.length && !bgColor[3]) {
        if (!bgColor[3] || !blend) {
          bgArray.set(fgColor, bgOffset);
        } else {
          const fgAlpha = fgColor[3] / 255.0;
          const bgAlpha = 1 - fgAlpha;

          bgArray.set(
            [
              bgAlpha * bgColor[0] + fgAlpha * fgColor[0],
              bgAlpha * bgColor[1] + fgAlpha * fgColor[1],
              bgAlpha * bgColor[2] + fgAlpha * fgColor[2],
              bgAlpha * bgColor[3] + fgAlpha * fgColor[3],
            ],
            bgOffset
          );
        }
      }

      bgOffset += 4;
      if (bgArray.length < bgOffset) break;
    }
  }

  return bgArray;
};

const render = (bounds, size, coords, pin) => {
  console.time("render");

  const { radius: pinRadius, buffer: pinBuffer } = pin;
  const pinSize = pinRadius * 2;
  const pinBitmap = new Uint8ClampedArray(pinBuffer);

  const getPoint = getLatLngToPoint(bounds, size);
  const [width, height] = size;

  const buffer = new ArrayBuffer(width * height * 4);
  const bitmap = new Uint8ClampedArray(buffer);

  for (let i = 0; i < coords.length / 2; i++) {
    const [x, y] = getPoint([coords[i * 2], coords[i * 2 + 1]]);
    // prettier-ignore
    compose(
      bitmap, width, height,
      pinBitmap, pinSize, pinSize,
      x - pinRadius, y - pinRadius,
    );
  }

  corner = [0, 0];

  console.timeEnd("render");
  postMessage(
    { type: "compose", payload: { bounds, corner, size, buffer } },
    { transfer: [buffer] }
  );
};

onmessage = ({ data: { type, payload } }) => {
  console.log(type, payload);
  switch (type) {
    case "init": {
      WORKER_PIN = payload.pin;
      return;
    }
    case "coords": {
      WORKER_COORDS_ARRAY = new Float32Array(payload);
      return;
    }
    case "render": {
      const { bounds, size } = payload;
      render(bounds, size, WORKER_COORDS_ARRAY, WORKER_PIN);
    }
  }
};
