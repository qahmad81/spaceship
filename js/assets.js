export const IMAGE_LIST = [
  "celestial_body.png",
  "planet_small.png",
  "planet_medium.png",
  "planet_large.png",
  "planet_giant.png",
  "sun.png",
  "shuttle.png",
  "wormhole.png",
  "space_station1.png",
  "space_station2.png",
  "space_station3.png",
  "rock.png",
];

export async function loadImages() {
  const images = {};
  const promises = IMAGE_LIST.map(
    (imageName) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          images[imageName.replace(".png", "")] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = `assets/${imageName}`;
      }),
  );
  await Promise.all(promises);
  return images;
}
