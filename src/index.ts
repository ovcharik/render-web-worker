import "./styles.css";

import ymaps from "yandex-maps";

import { coordsSource } from "./coords";
import { createPinImage } from "./pin";

import LayoutWorker from "worker-loader!./worker";

const layoutWorker = new LayoutWorker();

// init
const pin = createPinImage(6);
layoutWorker.postMessage(
  { type: "init", payload: { pin } },
  { transfer: [pin.buffer] }
);

// send coords
const toCode = (char: string) => char.charCodeAt(0);
const coords = Uint8Array.from(coordsSource, toCode);
layoutWorker.postMessage(
  { type: "coords", payload: coords.buffer },
  { transfer: [coords.buffer] }
);

console.log(ymaps, ymaps.templateLayoutFactory);

type Point = [number, number];
type Rect = [Point, Point];

type ComposePayload = {
  bounds: Rect;
  corner: Point;
  size: Point;
  buffer: ArrayBufferLike;
};

interface CanvasLayout extends ymaps.layout.templateBased.Base {
  inited: boolean;
  superclass: CanvasLayout;

  getData: () => {
    geoObject: ymaps.GeoObject;
    geometry: ymaps.geometry.base.Point;
  };
}

ymaps.ready(() => {
  const CanvasLayout = ymaps.templateLayoutFactory.createClass(
    `<canvas style="transform: translate(-50%, -50%); image-rendering: crisp-edges"></canvas>`,
    {
      build() {
        console.log(12, this, CanvasLayout);
        const ctor = CanvasLayout as unknown as CanvasLayout;
        ctor.superclass.build.call(this);

        const parent = this.getParentElement();
        const canvas = parent.getElementsByTagName("canvas")[0];

        const data = this.getData();
        const map = data.geoObject.getMap();
        const geometry = data.geometry;

        if (!this.inited) {
          const render = () => {
            const bounds = map.getBounds();
            const size = map.container.getSize();
            const payload = { bounds, size };

            console.time("render");
            layoutWorker.postMessage({ type: "render", payload });
          };

          const compose = (payload: ComposePayload) => {
            const { bounds, corner, size, buffer } = payload;

            canvas.width = size[0];
            canvas.height = size[1];

            const context = canvas.getContext("2d");
            const image = context!.getImageData(...corner, ...size);

            image.data.set(new Uint8ClampedArray(buffer));
            context!.imageSmoothingEnabled = false;
            context!.putImageData(image, ...corner, ...corner, ...size);

            geometry.setCoordinates(map.getCenter());
            console.timeEnd("render");
          };

          layoutWorker.addEventListener("message", ({ data }) => {
            if (data.type !== "compose") return;
            return compose(data.payload);
          });

          map.events.add("boundschange", render, this);
          render();

          this.inited = true;
        }
      },
    } as CanvasLayout
  );

  const center = [55.687796, 37.733753];
  const map = new ymaps.Map("map", { center, zoom: 10 });
  const layout = new ymaps.Placemark(center, {}, { iconLayout: CanvasLayout });

  map.geoObjects.add(layout);
});
