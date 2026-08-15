import { PYQ_IMAGE_BASE, pyqImageUrl, pyqImageSource } from "../pyqImages";

describe("pyqImages", () => {
  it("builds a Storage URL for a known figure name", () => {
    expect(pyqImageUrl("image_p25_Im0.jpg")).toBe(
      `${PYQ_IMAGE_BASE}/image_p25_Im0.jpg`,
    );
    expect(pyqImageSource("image_p1_Im0.jpg")).toEqual({
      uri: `${PYQ_IMAGE_BASE}/image_p1_Im0.jpg`,
    });
  });

  it("rejects missing or unsafe names", () => {
    expect(pyqImageUrl(null)).toBeNull();
    expect(pyqImageUrl("")).toBeNull();
    expect(pyqImageUrl("../secret.jpg")).toBeNull();
    expect(pyqImageUrl("pyq-images/image_p1_Im0.jpg")).toBeNull();
    expect(pyqImageUrl("not-a-pyq.png")).toBeNull();
    expect(pyqImageSource("oops")).toBeNull();
  });
});
