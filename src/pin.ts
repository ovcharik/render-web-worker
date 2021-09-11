export type Pin = { radius: number, buffer: ArrayBufferLike }

export const createPinImage = (radius: number): Pin => {
  const rad = Math.PI / 180;

  const size = radius * 2 + 2;
  const sizeHalf = size / 2;
  const pinCanvas = document.createElement("canvas");

  pinCanvas.width = size;
  pinCanvas.height = size;

  const context = pinCanvas.getContext("2d");
  if (!context) throw new Error('Canvas not supported');
  context.imageSmoothingQuality = "high";

  context.fillStyle = "rgba(0, 0, 0, 0.0)";
  context.fillRect(0, 0, size, size);

  context.fillStyle = "#3f51b5";
  context.beginPath();
  context.arc(sizeHalf, sizeHalf, radius, 0, 2 * Math.PI, true);
  context.fill();

  context.lineWidth = Math.round(radius * 0.15);
  context.strokeStyle = "rgba(0, 0, 0, 0.3)";
  context.beginPath();
  context.arc(sizeHalf, sizeHalf, radius * 0.9, rad * 170, rad * 330);
  context.stroke();

  context.lineWidth = Math.round(radius * 0.2);
  context.strokeStyle = "rgba(255, 255, 255, 0.4)";
  context.beginPath();
  context.arc(sizeHalf, sizeHalf, radius * 0.6, rad * 35, rad * 75);
  context.stroke();

  context.lineWidth = Math.round(radius * 0.1);
  context.strokeStyle = "rgba(255, 255, 255, 0.7)";
  context.beginPath();
  context.arc(sizeHalf, sizeHalf, radius, 0, 2 * Math.PI, true);
  context.stroke();

  const image = context.getImageData(0, 0, size, size);
  return { radius: sizeHalf, buffer: image.data.buffer };
};
